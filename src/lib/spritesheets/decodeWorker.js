// @ts-check
/** @import { WebMTrack } from '../inspector-js/inspectorjs-js' */
/** @import { SpriteData } from './FramePacker.js' */
/** @import { BASIS_FORMAT, MipLevelData } from './TextureCompressor' */
import { createWebMDemuxer } from "../inspector-js/inspectorjs-js";
import { FramePacker } from "./FramePacker.js";
import { SpritesheetCompressor } from "./TextureCompressor.js";
import { decodeWebmFrames } from "./decodeWebmFrames.js";
import { getUint8ArrayHash } from "./hasher.js";
import { Ktx2FileCache } from "./ktx2FileCache.js";

let ktx2FileCache = new Ktx2FileCache();
let compressorPromise = SpritesheetCompressor.create(ktx2FileCache);
onmessage = async function (e) {
	if (e.data?.type === "CreateSpritesheet") {
		const result = await decodeWebm(e.data.payload.buffer, e.data.payload.minimumScale, e.data.id);
		const id = e.data.id;
		if (result.type === "Cancel") {
			postMessage({ id, ...result });
		} else if (result.type === "SpritesheetCreated") {
			postMessage(
				{ id, ...result },
				{
					transfer: [...result.payload.sheet.levelData.map((l) => l.data.buffer)],
				}
			);
		}
	}
};
/**
 * @param {string} message
 * @returns {SpritesheetDataFromWorker}
 */
function errorResponse(message) {
	return { type: "Cancel", payload: { message } };
}

/**
 * @param {ArrayBuffer} buffer
 * @param {number} minimumScale
 * @param {string} id
 * @returns {Promise<SpritesheetDataFromWorker>}
 */
async function decodeWebm(buffer, minimumScale, id) {
	/** @type {import("./TextureCompressor").CompressedTextureData | undefined} */
	let compressedSheet;
	const data = new Uint8Array(buffer);
	const sourceHash = getUint8ArrayHash(data);
	const ktx2Buffer = await ktx2FileCache.getCachedKtxFile(id, sourceHash);
	let compressor = await compressorPromise;

	let spritesheetData = await ktx2FileCache.getCachedSprites(id, sourceHash);

	/** @type {CompressedSpritesheet} */
	let sheet;

	if (ktx2Buffer && spritesheetData) {
		compressedSheet = await compressor.transcodeKtx2Buffer(ktx2Buffer);
		if (!compressedSheet) {
			return errorResponse("Could not encode spritesheet to compressed texture");
		}
		sheet = { ...compressedSheet, fps: spritesheetData.frameRate, sprites: spritesheetData.sprites, scale: spritesheetData.scale };
	} else {
		const demuxer = createWebMDemuxer();
		demuxer.append(data);
		demuxer.end();
		const tracks = Object.values(demuxer.tracks);
		const hasAudio = tracks.some((t) => t.type === 1);
		if (hasAudio) {
			return errorResponse("File has Audio Tracks");
		}
		const videoTrack = tracks.find((t) => t.type === 0);
		if (!videoTrack) {
			return errorResponse("File has no Video Tracks");
		}
		const metadata = videoTrack.getMetadata();
		const codec = videoTrack.getCodec();
		let frames, alphaFrames;
		try {
			[frames, alphaFrames] = await Promise.all([
				decodeWebmFrames({ metadata, codec, frameData: videoTrack.frames }),
				decodeWebmFrames({ metadata, codec, frameData: videoTrack.framesAlpha }),
			]);
		} catch (error) {
			if (error instanceof Error) {
				return errorResponse(error.message);
			}
			return errorResponse("Error decoding video");
		}
		if (frames.length !== alphaFrames.length && videoTrack.framesAlpha.length !== 0) {
			return errorResponse("alpha frame count mismatch");
		}
		const framePacker = new FramePacker()
		const packedSheet = await framePacker.packFrames(frames, alphaFrames, minimumScale);
		if (!packedSheet) {
			return errorResponse("Could not pack spritesheet");
		}
		const frameRate = !videoTrack.nsPerFrame || isNaN(videoTrack.nsPerFrame) ? metadata.frameRate : 1e9 / videoTrack.nsPerFrame

		if (!frameRate) {
			return errorResponse("Could not get frameRate for video file");
		}

		ktx2FileCache.saveSpritesToCache(id, sourceHash, { sprites: packedSheet.sprites, frameRate, scale: packedSheet.scale });
		
		compressedSheet = await compressor.getCompressedRessourceInfo(
			packedSheet.imageBuffer,
			sourceHash,
			packedSheet.w,
			packedSheet.h,
			id
		);
		
		if (!compressedSheet) {
			return errorResponse("Could not encode spritesheet to compressed texture");
		}
		
		sheet = { ...compressedSheet, sprites: packedSheet.sprites, fps: frameRate, scale: packedSheet.scale };
	}

	return {
		type: "SpritesheetCreated",
		payload: { sheet },
	};
}

/**
 * @typedef {Object} SpritesheetMessageBase
 * @property {string} id
 */
/**
 * @typedef {| { type: 'Cancel'; payload: { message: string } }
 * 	| { type: 'SpritesheetCreated'; payload: { sheet: CompressedSpritesheet } }} SpritesheetDataFromWorker
 */
/** @typedef {SpritesheetMessageBase & SpritesheetDataFromWorker} SpritesheetMessageFromWorker */
/**
 * @typedef {Object} SpritesheetDataToWorker
 * @property {'CreateSpritesheet'} type
 * @property {Object} payload
 * @property {ArrayBuffer} payload.buffer
 * @property {number} payload.minimumScale
 */
/** @typedef {SpritesheetMessageBase & SpritesheetDataToWorker} SpritesheetMessageToWorker */
/**
 * @typedef {Object} CompressedSpritesheet
 * @property {keyof typeof BASIS_FORMAT} format
 * @property {MipLevelData[]} levelData
 * @property {number} fps
 * @property {number} scale
 * @property {SpriteData[]} sprites
 */
