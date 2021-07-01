import AnimatedSection from "./animated.js";
import {easeFunctions} from "../canvas-effects/ease.js";
import * as lib from "../lib.js";

export default class AnimationSection extends AnimatedSection{

    constructor(inSequence, inTarget) {
        super(inSequence);
        this._teleportTo = false;
        this._originObject = false;
        this._moveTowards = false;
        this._moveSpeed = 23;
        this._offset = { x: 0, y: 0 };
        this._closestSquare = false;
        if(inTarget) this.on(inTarget);
    }

    /**
     * Sets the target object to be animated
     *
     * @param {Token|Tile|object} inTarget
     * @returns {AnimationSection} this
     */
    on(inTarget){
        this._originObject = this._validateLocation(inTarget);
        return this;
    }

    /**
     * Sets the location to move the target object to
     *
     * @param {Token|Tile|object} inTarget
     * @param {object} options
     * @returns {AnimationSection} this
     */
    moveTowards(inTarget, options = {}){
        let mergeFunc = this.version ? foundry.utils.mergeObject : mergeObject;
        options = mergeFunc({
            ease: "linear",
            delay: 0,
            target: { x: 0, y: 0 }
        }, options);
        if(typeof options.ease !== "string") this.sequence.throwError(this, "moveTowards", "options.ease must be of type string");
        if(typeof options.delay !== "number") this.sequence.throwError(this, "moveTowards", "options.delay must be of type number");
        options.target = this._validateLocation(inTarget);
        this._moveTowards = options;
        this._teleportTo = false;
        return this;
    }

    /**
     * Sets the location to move the target object to
     *
     * @param {Token|Tile|object} inTarget
     * @param {object} options
     * @returns {AnimationSection} this
     */
    rotateTowards(inTarget, options = {}){
        let mergeFunc = this.version ? foundry.utils.mergeObject : mergeObject;
        options = mergeFunc({
            duration: 0,
            ease: "linear",
            delay: 0,
            offset: 0
        }, options);
        if(typeof options.duration !== "number") this.sequence.throwError(this, "rotateTowards", "options.duration must be of type number");
        if(typeof options.ease !== "string") this.sequence.throwError(this, "rotateTowards", "options.ease must be of type string");
        if(typeof options.delay !== "number") this.sequence.throwError(this, "rotateTowards", "options.delay must be of type number");
        options.target = this._validateLocation(inTarget);
        this._rotateTowards = options;
        return this;
    }

    /**
     * Sets the location to teleport the target object to
     *
     * @param {Token|Tile|object} inTarget
     * @param {object} options
     * @returns {AnimationSection} this
     */
    teleportTo(inTarget, options = {}){
        let mergeFunc = this.version ? foundry.utils.mergeObject : mergeObject;
        options = mergeFunc({
            delay: 0,
            target: { x: 0, y: 0 }
        }, options);
        if(typeof options.delay !== "number") this.sequence.throwError(this, "teleportTo", "options.delay must be of type number");
        options.target = this._validateLocation(inTarget);
        this._teleportTo = options;
        this._moveTowards = false;
        return this;
    }

    /**
     * Causes the movement or teleportation to be offset in the X and/or Y axis
     *
     * @param {object} inOffset
     * @returns {AnimationSection} this
     */
    offset(inOffset){
        let mergeFunc = this.version ? foundry.utils.mergeObject : mergeObject;
        inOffset = mergeFunc({ x: 0, y: 0 }, inOffset);
        this._offset = this._validateLocation(inOffset);
        return this;
    }

    /**
     * Causes the movement or teleportation to pick the closest non-intersecting square, if the target is a token or tile
     *
     * @param {boolean} inBool
     * @returns {AnimationSection} this
     */
    closestSquare(inBool = true){
        if(typeof inBool !== "boolean") this.sequence.throwError(this, "closestSquare", "inBool must be of type boolean");
        this._closestSquare = inBool;
        return this;
    }

    async _run() {
        return this._runAnimate();
    }

    async updateObject(obj, attributes, animate = false){
        await obj.document.update(attributes, {animate: animate});
    }

    async execute(){
        if(!(await this.shouldPlay())) return;
        return new Promise(async (resolve) => {
            if (this.shouldAsync) {
                await this._run();
            } else {
                this._run();
            }
            resolve();
        });
    }

    _getClosestSquare(origin, target) {

        let originLoc = this._getCleanPosition(origin);
        let targetLoc = this._getCleanPosition(target);

        let originSizeWidth = (origin?.data?.width ?? 1) * canvas.grid.size;
        let originSizeHeight = (origin?.data?.height ?? 1) * canvas.grid.size;
        let originBottom = Math.max(originSizeWidth - canvas.grid.size, canvas.grid.size);
        let originRight = Math.max(originSizeHeight - canvas.grid.size, canvas.grid.size);

        let targetSizeWidth = (target?.data?.width ?? 1) * canvas.grid.size;
        let targetSizeHeight = (target?.data?.height ?? 1) * canvas.grid.size;

        let ray = new Ray(originLoc, targetLoc);

        let dx = ray.dx;
        let dy = ray.dy;

        if (dx > 0 && Math.abs(dx) > originRight) {
            dx -= originSizeWidth;
        } else if (dx < 0 && Math.abs(dx) > targetSizeWidth){
            dx += targetSizeHeight;
        }else{
            dx = 0;
        }

        if (dy > 0 && Math.abs(dy) > originBottom) {
            dy -= originSizeHeight;
        } else if (dy < 0 && Math.abs(dy) > targetSizeHeight){
            dy += targetSizeHeight;
        }else{
            dy = 0;
        }

        return {
            x: originLoc.x + dx,
            y: originLoc.y + dy
        };

    }

    _getCleanPosition(obj, measure = false){

        let pos = {
            x: obj?.data?.x ?? obj?.x ?? 0,
            y: obj?.data?.y ?? obj?.y ?? 0
        }

        if(obj instanceof MeasuredTemplate){
            if(measure){
                if(obj.data.t === "cone" || obj.data.t === "ray"){
                    pos.x = obj.ray.B.x;
                    pos.y = obj.ray.B.y;
                }
            }
        }

        return pos;
    }

    _clampRotations(to, from){
        if(Math.abs(from - to) > 180){
            if(to < 0){
                to += 360;
            }else if(from > to){
                from -= 360;
            }
        }
        return [from, to];
    }

    /**
     * This needs a rewrite, jeesus.
     */
    async _runAnimate(){

        let animData = {
            attributes: [],
            maxFPS: 1000 / game.settings.get('core', "maxFPS"),
            lastTimespan: performance.now(),
            totalDt: 0
        }

        let overallDuration = this._duration ? this._duration : 0;

        if(this._rotateTowards){

            let offset = (this._angle ? this._angle : 0) + this._rotateTowards.offset;

            animData.attributes.push({
                name: "rotationTowards",
                offset: offset,
                origin: this._originObject,
                target: this._rotateTowards.target,
                from: false,
                to: false,
                progress: 0,
                done: false,
                duration: this._rotateTowards.duration,
                durationDone: 0,
                delay: this._rotateTowards.delay,
                ease: easeFunctions[this._rotateTowards.ease]
            })

            let rotateDuration = this._rotateTowards.duration + this._rotateTowards.delay;

            overallDuration = overallDuration > rotateDuration ? overallDuration : rotateDuration;

        }

        if(this._fadeIn){

            let from = typeof this._opacity === "number" ? this._opacity : this._originObject.alpha;

            animData.attributes.push({
                name: "alpha",
                from: from,
                to: 1.0,
                progress: 0,
                done: false,
                duration: this._fadeIn.duration,
                durationDone: 0,
                delay: this._fadeIn.delay,
                ease: easeFunctions[this._fadeIn.ease]
            })

            let fadeDuration = this._fadeIn.duration + this._fadeIn.delay;

            overallDuration = overallDuration > fadeDuration ? overallDuration : fadeDuration;

        }

        if(this._rotateIn){

            let from = this._angle ? this._angle : this._originObject.data.rotation;
            let to = this._rotateIn.value;

            [from, to] = this._clampRotations(from, to);

            animData.attributes.push({
                name: "rotation",
                from: from,
                to: to,
                progress: 0,
                done: false,
                duration: this._rotateIn.duration,
                durationDone: 0,
                delay: this._rotateIn.delay,
                ease: easeFunctions[this._rotateIn.ease]
            })

            let rotateDuration = this._rotateIn.duration + this._rotateIn.delay;

            overallDuration = overallDuration > rotateDuration ? overallDuration : rotateDuration;

        }

        if(this._moveTowards){

            let originLoc = this._getCleanPosition(this._originObject);
            let targetLoc = this._closestSquare
                ? this._getClosestSquare(this._originObject, this._moveTowards.target)
                : this._getCleanPosition(this._moveTowards.target);


            targetLoc.x += this._offset.x;
            targetLoc.y += this._offset.y;

            let originalDx = targetLoc.x - originLoc.x;
            let originalDy = targetLoc.y - originLoc.y;
            let originalDistance = Math.sqrt(originalDx * originalDx + originalDy * originalDy);

            let duration = this._duration
                ? this._duration
                : (originalDistance / this._moveSpeed) * animData.maxFPS;

            let moveDuration = duration + this._moveTowards.delay;

            overallDuration = overallDuration > moveDuration ? overallDuration : moveDuration;

            if (!this._duration && this._moveTowards.ease === "linear") {
                await this.updateObject(this._originObject, targetLoc, true);
            }else{
                animData.attributes.push({
                    name: "position",
                    origin: originLoc,
                    target: targetLoc,
                    originalDistance: originalDistance,
                    currentDistance: 0,
                    progress: 0,
                    speed: 0,
                    duration: duration,
                    done: false,
                    ease: easeFunctions[this._moveTowards.ease],
                    delay: this._moveTowards.delay
                })
            }
        }

        if(this._teleportTo){
            setTimeout(async () => {
                let targetLocation = this._closestSquare
                    ? this._getClosestSquare(this._originObject, this._teleportTo.target)
                    : this._getCleanPosition(this._teleportTo.target);
                targetLocation.x += this._offset.x;
                targetLocation.y += this._offset.y;
                await this.updateObject(this._originObject, targetLocation);
            }, this._teleportTo.delay);
            overallDuration = overallDuration > this._teleportTo.delay ? overallDuration : this._teleportTo.delay;
        }

        if(this._fadeOut){

            let to = typeof this._opacity === "number" ? this._opacity : this._originObject.alpha;

            animData.attributes.push({
                name: "alpha",
                from: 1.0,
                to: to,
                progress: 0,
                done: false,
                duration: this._fadeOut.duration,
                durationDone: 0,
                delay: overallDuration - this._fadeOut.duration,
                ease: easeFunctions[this._fadeOut.ease]
            })
        }

        if(this._rotateOut){

            let from = this._angle ? this._angle : this._originObject.data.rotation;
            let to = this._rotateOut.value;

            if(this._rotateIn) from += this._rotateIn.value;

            [from, to] = this._clampRotations(from, to);

            animData.attributes.push({
                name: "rotation",
                from: from,
                to: to,
                progress: 0,
                done: false,
                duration: this._rotateOut.duration,
                durationDone: 0,
                delay: overallDuration - this._rotateOut.duration,
                ease: easeFunctions[this._rotateOut.ease]
            });

        }

        return new Promise(async (resolve) => {

            this.animate(animData, resolve);

            setTimeout(resolve, Math.max(0, overallDuration + this._waitUntilFinishedDelay + animData.maxFPS));

        })

    }

    async animate(animData, resolve, timespan){

        // If it's not the first tick
        if (timespan) {

            let animatedAttributes = {};

            let dt = timespan - animData.lastTimespan;

            // Limit to set FPS
            if (dt >= animData.maxFPS) {

                animData.totalDt += dt;

                for(let attribute of animData.attributes) {

                    if(attribute.done) continue;

                    if(animData.totalDt < attribute.delay) continue;

                    if(attribute.name === "position"){

                        attribute.speed = attribute.originalDistance / (attribute.duration / dt);

                        attribute.currentDistance += attribute.speed;

                        attribute.progress = attribute.currentDistance / attribute.originalDistance;

                        let x = lib.lerp(attribute.origin.x, attribute.target.x, attribute.ease(attribute.progress));
                        let y = lib.lerp(attribute.origin.y, attribute.target.y, attribute.ease(attribute.progress));

                        if (attribute.currentDistance >= attribute.originalDistance) {
                            x = attribute.target.x;
                            y = attribute.target.y;
                            attribute.done = true;
                        }

                        animatedAttributes['x'] = x;
                        animatedAttributes['y'] = y;

                    }else {

                        if(attribute.name === "rotationTowards" && !attribute.from && !attribute.to){
                            let ray = new Ray(attribute.origin, attribute.target)
                            let angle = ray.angle * 180/Math.PI;
                            angle += attribute.offset;
                            attribute.from = attribute.origin.data.rotation;
                            attribute.to = angle;
                            if(Math.abs(attribute.from - attribute.to) > 180){
                                if(attribute.to < 0){
                                    attribute.to += 360;
                                }else if(attribute.from > attribute.to){
                                    attribute.from -= 360;
                                }
                            }
                            attribute.name = "rotation";
                        }

                        attribute.durationDone += dt;

                        attribute.progress = attribute.durationDone / attribute.duration;

                        let val = lib.lerp(attribute.from, attribute.to, attribute.ease(attribute.progress));

                        if (attribute.progress >= 1.0) {
                            val = attribute.to;
                            attribute.done = true;
                        }

                        animatedAttributes[attribute.name] = val;

                    }

                }

                if(Object.keys(animatedAttributes).length > 0) {
                    await this.updateObject(this._originObject, animatedAttributes);
                }

                animData.attributes = animData.attributes.filter(a => !a.done);

                if(animData.attributes.length === 0) return;

                animData.lastTimespan = timespan;

            }

        }

        let self = this;
        requestAnimationFrame(function (timespan) {
            self.animate(animData, resolve, timespan);
        });
    }

}