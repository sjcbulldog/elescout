//
// XeroSize - represnets the size of an object in 2d space
//
class XeroSize {
    constructor(width, height) {
        this.width = width ;
        this.height = height ;
    }

    toString() {
        return 'XeroSize ' + this.width + ',' + this.height ;
    }
}

//
// XeroPoint - represents the location of an object in 2d space
//
class XeroPoint {
    constructor(x, y) {
        this.x = x ;
        this.y = y ;
    }

    toString() {
        return 'XeroPoint ' + this.x + ',' + this.y ;
    }
}

class XeroMouseRegion {
    constructor(name, which, pos, size, cb) {
        this.name_ = name ;
        this.which_ = which ;
        this.pos_ = pos ;
        this.size_ = size ;
        this.cb_ = cb ;
    }
}

//
// Represents a canvas with a backing image used as the background of an
// image based scouting section.
//
class XeroImageSection extends XeroBaseSection {
    constructor(info, json, color, reversed) {
        super(json.name, true, document.createElement('canvas')) ;
        this.canvas_ = this.top_ ;                 // The canvas HTML elements
        this.canvas_.classList.add('form-canvas') ;
        this.info_ = info ;                     // The image describing and containing the background images
        this.json_ = json ;                     // The JSON describing the controls on top of the image
        this.reverse_updated_ = false ;
        this.sizesInited_ = false ;
        this.regions_ = [] ;
        this.values_ = [] ;
        this.reverse_ = reversed ;
        this.color_ = color ;

        this.canvas_.addEventListener('mousedown', this.mousePress.bind(this)) ;
    }

    getValue(tag) {
        for(let v of this.values_) {
            if (v.tag === tag) {
                return v ;
            }
        }

        return undefined ;
    }

    setValue(tag, type, value) {
        let obj = this.getValue(tag) ;
        if (obj) {
            obj.type = type ;
            obj.value = value ;
        }
        else {
            obj = {
                type: type,
                value: value,
                tag: tag 
            }
            this.values_.push(obj) ;
        }

        return obj ;
    }

    computeScaleFactor() {
        //
        // Force the canvas to the size of its parent
        //
        this.canvas_.width = this.canvas_.parentElement.offsetWidth ;
        this.canvas_.height = this.canvas_.parentElement.offsetHeight ;

        //
        // Calculate the aspect ratios of the image and canvas
        //
        const imageAspectRatio = this.info_.image_.width / this.info_.image_.height;
        const canvasAspectRatio = this.canvas_.width / this.canvas_.height;
      
        this.scaleFactor_ = 1;
      
        // Determine how to scale the image based on aspect ratios
        if (imageAspectRatio > canvasAspectRatio) {
          // Image is wider than canvas, fit to width
          this.scaleFactor_ = this.canvas_.width / this.info_.image_.width;
        } else {
          // Image is taller than canvas, fit to height
          this.scaleFactor_ = this.canvas_.height / this.info_.image_.height;
        }

        this.scaledWidth_ = this.info_.image_.width * this.scaleFactor_;
        this.scaledHeight_ = this.info_.image_.height * this.scaleFactor_;
    }

    fieldToImagePt(pt) {
        let imwidth = this.info_.bottomright.x - this.info_.topleft.x ;
        let imheight = this.info_.bottomright.y - this.info_.topleft.y ;

        let fpcntx = pt.x / this.info_.fieldsize.width ;
        let fpcnty = pt.y / this.info_.fieldsize.height ;

        let impixw = fpcntx * imwidth ;
        let impixh = fpcnty * imheight ;

        let imx = impixw + this.info_.topleft.x ;
        let imy = this.info_.bottomright.y - impixh ;

        return new XeroPoint(imx, imy) ;
    }

    fieldToImageSize(sz) {
        let imwidth = this.info_.bottomright.x - this.info_.topleft.x ;
        let imheight = this.info_.bottomright.y - this.info_.topleft.y ;

        let width  = sz.width / this.info_.fieldsize.width * imwidth ;
        let height = sz.height / this.info_.fieldsize.height * imheight ;

        return new XeroSize(width, height) ;
    }

    imageToCanvasPt(pt) {
        let cx = pt.x * this.scaleFactor_ ;
        let cy = pt.y * this.scaleFactor_ ;

        return new XeroPoint(cx, cy) ;
    }

    imageToCanvasSize(sz) {
        return new XeroSize(sz.width * this.scaleFactor_, sz.height * this.scaleFactor_) ;
    }

    fieldToCanvasPt(pt) {
        return this.imageToCanvasPt(this.fieldToImagePt(pt)) ;
    }

    fieldToCanvasSize(sx) {
        return this.imageToCanvasSize(this.fieldToImageSize(sx)) ;
    }

    drawImageOnCanvas() {

        // Calculate the scaled image dimensions
        const scaledWidth = this.info_.image_.width * this.scaleFactor_;
        const scaledHeight = this.info_.image_.height * this.scaleFactor_;
      
        // Clear the canvas
        this.ctx_.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
      
        // Draw the image on the canvas, centered and scaled
        this.ctx_.drawImage(this.info_.image_, 0, 0, this.scaledWidth_, this.scaledHeight_) ; 
    }

    mousePress(evt) {
        var rect = this.canvas_.getBoundingClientRect();
        let mpx = evt.clientX - rect.left ;
        let mpy = evt.clientY - rect.top ;

        if (this.reverse_) {
            mpx = rect.right - evt.clientX ;
        }

        for(let region of this.regions_) {
            if (mpx >= region.pos_.x && mpx <= region.pos_.x + region.size_.width &&
                mpy >= region.pos_.y && mpy <= region.pos_.y + region.size_.height) {
                
                region.cb_(region.name_, region.which_) ;
                break ;
            }
        }
    }

    containsMouseRegion(name, which) {
        for(let region of this.regions_) {
            if (region.name_ === name && region.which_ === which) {
                return true ;
            }
        }

        return false;
    }

    mouseClickRegisterRegion(pos, size, name, which, cb) {
        let region = new XeroMouseRegion(name, which, pos, size, cb) ;
        this.regions_.push(region) ;
    }

    booleanControlCallback(name) {
        let v = this.getValue(name) ;
        this.setValue(name, v.type, !v.value) ;

        this.drawImageSection() ;
    }

    doRect(ctx, pos, size, color, width) {
        ctx.strokeStyle = color ;
        ctx.lineWidth = width ;
        ctx.beginPath() ;
        ctx.moveTo(pos.x, pos.y) ;
        ctx.lineTo(pos.x, pos.y + size.height) ;
        ctx.lineTo(pos.x + size.width, pos.y + size.height) ;
        ctx.lineTo(pos.x + size.width, pos.y) ;
        ctx.lineTo(pos.x, pos.y) ;
        ctx.stroke() ;
    }

    doCross(ctx, pos, size, color, width, gap) {
        ctx.strokeStyle = color ;
        ctx.lineWidth = width ;

        ctx.beginPath() ;
        ctx.moveTo(pos.x + gap, pos.y + size.height / 2.0) ;
        ctx.lineTo(pos.x + size.width - gap, pos.y + size.height / 2.0) ;
        ctx.stroke() 

        ctx.beginPath() ;
        ctx.moveTo(pos.x + size.width / 2.0, pos.y + gap) ;
        ctx.moveTo(pos.x + size.width / 2.0, pos.y + size.height - gap) ;
        ctx.stroke() 
    }

    doDash(ctx, pos, size, color, width, gap) {
        ctx.strokeStyle = color ;
        ctx.lineWidth = width ;
        ctx.beginPath() ;
        ctx.moveTo(pos.x + gap, pos.y + size.height / 2.0) ;
        ctx.lineTo(pos.x + size.width - gap, pos.y + size.height / 2.0) ;
        ctx.stroke() ;
    }

    doText(ctx, pos, size, str) {
        ctx.textBaseline = 'top' ;
        ctx.textAlign = 'center';
        ctx.textRendering = 'optimizeLegibility' ;
        ctx.font = "64px serif";
        ctx.fillText(str, pos.x + size.width / 2.0, pos.y) ;
    }

    upDownPlusClicked(name) {
        let v = this.getValue(name) ;
        if (v.value < v.maximum) {
            this.setValue(name, v.type, v.value + 1) ;
            this.drawImageSection() ;
        }
    }

    upDownMinusClicked(name) {
        let v = this.getValue(name) ;
        if (v.value > v.minimum) {
            this.setValue(name, v.type, v.value - 1) ;
            this.drawImageSection() ;
        }
    }

    drawUpDownControl(ctrl, color) {
        let value = this.getValue(ctrl.tag) ;
        if (!value) {
            value = this.setValue(ctrl.tag, 'number', ctrl.minimum) ;
        }

        value.minimum = ctrl.minimum ;
        value.maximum = ctrl.maximum ;

        let part = ctrl[color].size.height / 3.0 ;
        let left = ctrl[color].position.x ;
        let top = ctrl[color].position.y + ctrl[color].size.height / 2.0 ;

        let pos1 = this.fieldToCanvasPt(new XeroPoint(left, top)) ;
        let size = this.fieldToCanvasSize(new XeroSize(ctrl[color].size.width, part)) ;
        this.doRect(this.ctx_, pos1, size, 'green', 2.0) ;
        this.doCross(this.ctx_, pos1, size, 'green', 2.0, 10.0) ;
        if (!this.containsMouseRegion(ctrl.tag, 1)) {
            this.mouseClickRegisterRegion(pos1, size, ctrl.tag, 1, this.upDownPlusClicked.bind(this)) ;
        }

        let pos3 = this.fieldToCanvasPt(new XeroPoint(left, top - 2 * part)) ;
        this.doRect(this.ctx_, pos3, size, 'red', 2.0) ;
        this.doDash(this.ctx_, pos3, size, 'red', 2.0, 10.0) ;
        if (!this.containsMouseRegion(ctrl.tag, 2)) {
            this.mouseClickRegisterRegion(pos3, size, ctrl.tag, 2, this.upDownMinusClicked.bind(this)) ;
        }

        let pos2 = this.fieldToCanvasPt(new XeroPoint(left, top - part - 1/12)) ;
        let size2 = this.fieldToCanvasSize(new XeroSize(ctrl[color].size.width, part - 2/12));
        this.doRect(this.ctx_, pos2, size2, 'black', 4.0) ;
        this.doText(this.ctx_, pos2, size2, value.value.toString()) ;

    }

    drawBooleanControl(ctrl, color) {
        let value = this.getValue(ctrl.tag) ;
        if (!value) {
            value = this.setValue(ctrl.tag, 'boolean', false) ;
        }

        //
        // The point given is the center of the boolean box, so we find
        // the upper left hand corner to draw the box
        //
        let cornerx = ctrl[color].position.x - ctrl[color].size.width / 2 ;
        let cornery = ctrl[color].position.y + ctrl[color].size.height / 2 ;

        //
        // Get the position in canvas coordinates
        //
        let pos = this.fieldToCanvasPt(new XeroPoint(cornerx, cornery)) ;

        //
        // Get the size in canvas coordinates
        //
        let size = this.fieldToCanvasSize(new XeroSize(ctrl[color].size.width, ctrl[color].size.height)) ;

        //
        // Setup region to look for mouse down events
        //
        if (!this.containsMouseRegion(ctrl.tag)) {
            this.mouseClickRegisterRegion(pos, size, ctrl.tag, 1, this.booleanControlCallback.bind(this)) ;
        }

        //
        // Draw the basic box
        //
        this.ctx_.lineWidth = 5.0 ;
        this.ctx_.strokeStyle = 'green' ;
        this.ctx_.strokeRect(pos.x, pos.y, size.width, size.height) ;

        if (value && value.value) {
            this.ctx_.beginPath() ;
            this.ctx_.moveTo(pos.x, pos.y) ;
            this.ctx_.lineTo(pos.x + size.width, pos.y + size.height) ;
            this.ctx_.stroke() ;

            this.ctx_.beginPath() ;
            this.ctx_.moveTo(pos.x, pos.y + size.height) ;
            this.ctx_.lineTo(pos.x + size.width, pos.y) ;
            this.ctx_.stroke() ;
        }
    }

    drawControl(ctrl, color) {
        if (ctrl.type === 'boolean') {
            this.drawBooleanControl(ctrl, color) ;
        }
        else if (ctrl.type === 'updown') {
            this.drawUpDownControl(ctrl, color) ;
        }
    }

    drawImageSection() {
        if (!this.info_.loaded_) {
            return ;
        }

        if (!this.sizesInited_) {
            this.sizesInited_ = true ;
            this.computeScaleFactor() ;
        }

        this.ctx_ = this.canvas_.getContext('2d');

        if (this.reverse_ && !this.reverse_updated_) {
            this.ctx_.translate(this.canvas_.width, 0);
            this.ctx_.scale(-1, 1) ;
            this.reverse_updated_ = true ;
        }


        this.drawImageOnCanvas() ;
        for(let item of this.json_.items) {
            this.drawControl(item, this.color_) ;
        }

        this.cts_ = undefined ;
    }
}
