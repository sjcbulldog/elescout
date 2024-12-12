let resize_top ;
let resize_left ;
let resize_right ;
let resize_close ;

const moveBarrierLeft = function(e) {
    let dx = 5 ;
    const resizer = document.getElementById('dragMe');
    const leftSide = resizer.previousElementSibling;
    leftWidth = leftSide.getBoundingClientRect().width;

    leftSide.style.width = Math.floor(leftWidth - dx) + 'px' ;
    console.log(`right: before ${leftWidth}, after ${leftSide.getBoundingClientRect().width}`) ;
}

const moveBarrierRight = function(e) {
    let dx = 200 ;
    const resizer = document.getElementById('dragMe');
    const leftSide = resizer.previousElementSibling;
    leftWidth = leftSide.getBoundingClientRect().width;

    leftSide.style.width = Math.floor(leftWidth * 2) + 'px' ;
    console.log(`right: before ${leftWidth}, after ${leftSide.getBoundingClientRect().width}`) ;
}

function resizeCreate() {
    resize_top = document.createElement('div') ;
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
}

function resizeShow() {
    let parent = document.getElementById('rightcontent');
    parent.append(resize_top) ;
    resize_top.style.display = 'block' ;
}

function resizeHide() {
    if (resize_top.parentElement) {
        resize_top.parentElement.removeChild(resize_top) ;
    }
    resize_top.style.display = 'none' ;
}

let resizeShowInterval ;

function mousePress(e) {
    resizeShowInterval = setInterval(() => { resizeShow() }, 3000) ;
}

function mouseRelease(e) {
    clearInterval(resizeShowInterval);
}

document.addEventListener('mousedown', mousePress) ;
document.addEventListener('mouseup', mouseRelease) ;
document.addEventListener('touchstart', mousePress) ;
document.addEventListener('touchenv', mouseRelease) ;