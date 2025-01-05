let resize_top ;
let resize_left ;
let resize_right ;
let resize_close ;
let resize_left_orig_width ;
let resize_left_first = true ;
let resize_win_visible = false ;

const moveBarrierLeft = function(e) {
    const resizer = document.getElementById('dragMe');
    const leftSide = resizer.previousElementSibling;

    if (resize_left_first) {
        resize_left_orig_width = leftSide.getBoundingClientRect().width ;
        resize_left_first = false ;
    }

    const leftWidth = leftSide.getBoundingClientRect().width;
    const leftScale = leftWidth / resize_left_orig_width ;
    const dx = -5 * leftScale ;
    const parentWidth = resizer.parentNode.getBoundingClientRect().width;
    let newLeftWidth = leftWidth + dx;

    leftSide.style.width = newLeftWidth + 'px';

    console.log('moveBarrierRight') ;
    console.log('  resize_left_orig_width = ' + resize_left_orig_width);
    console.log('  leftScale = ' + leftScale);
    console.log('  leftWidth = ' + leftWidth);
    console.log('  parentWidth = ' + parentWidth);
    console.log('  newLeftWidth = ' + newLeftWidth);
    console.log('  leftSide.style.width = ' + leftSide.style.width);
}

const moveBarrierRight = function(e) {
    const resizer = document.getElementById('dragMe');
    const leftSide = resizer.previousElementSibling;

    if (resize_left_first) {
        resize_left_orig_width = leftSide.getBoundingClientRect().width ;
        resize_left_first = false ;
    }

    const leftWidth = leftSide.getBoundingClientRect().width;
    const leftScale = leftWidth / resize_left_orig_width ;
    const dx = 5 * leftScale ;
    const parentWidth = resizer.parentNode.getBoundingClientRect().width;
    const newLeftWidth = leftWidth + dx;

    leftSide.style.width = newLeftWidth + 'px';

    console.log('moveBarrierRight') ;
    console.log('  resize_left_orig_width = ' + resize_left_orig_width);
    console.log('  leftScale = ' + leftScale);
    console.log('  leftWidth = ' + leftWidth);
    console.log('  parentWidth = ' + parentWidth);
    console.log('  newLeftWidth = ' + newLeftWidth);
    console.log('  leftSide.style.width = ' + leftSide.style.width);
}

function resizeCreate() {
    let parent = document.body ;

    resize_top = document.createElement('div') ;
    resize_top.style.display = 'none' ;
    resize_top.className = 'resize-win' ;

    resize_left = document.createElement('button') ;
    resize_left.className = 'resize-win-left' ;
    resize_left.textContent = '<=' ;
    resize_top.append(resize_left) ;
    resize_left.addEventListener('click', moveBarrierLeft) ;
    
    resize_right = document.createElement('button') ;
    resize_right.className = 'resize-win-right' ;
    resize_right.textContent = '=>' ;
    resize_top.append(resize_right) ;
    resize_right.addEventListener('click', moveBarrierRight) ;

    resize_close = document.createElement('button') ;
    resize_close.className = 'resize-win-close' ;
    resize_close.textContent = 'X' ;
    resize_top.append(resize_close) ;
    resize_close.addEventListener('click', function() {
        resizeHide();
    }) ;
    
    parent.append(resize_top) ;
}

function resizeShow() {
    if (resize_win_visible) {
        return ;
    }

    const rwidth = 750 ;
    const rheight = 300 ;

    resize_top.style.display = 'block' ;
    resize_top.style.position = 'absolute' ;
    resize_top.style.width = rwidth + 'px' ;
    resize_top.style.height = rheight + 'px' ;

    let rect = resize_top.parentNode.getBoundingClientRect() ;
    let resizerect = resize_top.getBoundingClientRect() ;
    let loff = (rect.width - rwidth) / 2 ;
    let toff = (rect.height - rheight) / 2 ;

    resize_top.style.top = toff + 'px' ;
    resize_top.style.left = loff + 'px' ;
    resize_top.style.zIndex = 1 ;

    resize_win_visible = true ;

    console.log('resizeShow') ;
    console.log('  display = ' + resize_top.style.display) ;
    console.log('  rect = ' + JSON.stringify(rect)) ;
    console.log('  resizerect = ' + JSON.stringify(resizerect)) ;
    console.log('  loff = ' + loff) ;
    console.log('  toff = ' + toff) ;
}

function resizeHide() {
    resize_top.style.display = 'none' ;
    resize_win_visible = false ;
}

let resizeShowTimeout ;

function mousePress(e) {
    resizeShowTimeout = setTimeout(() => { resizeShow() }, 3000) ;
}

function mouseRelease(e) {
    clearTimeout(resizeShowTimeout);
}

document.addEventListener('mousedown', mousePress) ;
document.addEventListener('mouseup', mouseRelease) ;
document.addEventListener('touchstart', mousePress) ;
document.addEventListener('touchend', mouseRelease) ;