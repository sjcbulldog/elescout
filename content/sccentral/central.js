let currentView = undefined ;

let adown = false ;
let sdown = false ;
let ddown = false ;
let fdown = false ;

document.addEventListener('keyup', function(event) {
  if (event.key == 'a') {
    adown = false ;
  }
  else if (event.key == 's') {
    sdown = false ;
  }
  else if (event.key == 'd') {
    ddown = false ;
  }
  else if (event.key == 'f') {
    fdown = false ;
  }
});

document.addEventListener('keydown', function(event) {
  if (event.key == 'a') {
    adown = true ;
  }
  else if (event.key == 's') {
    sdown = true ;
  }
  else if (event.key == 'd') {
    ddown = true ;
  }
  else if (event.key == 'f') {
    fdown = true ;
  }

  if (adown && sdown && ddown && fdown) {
    window.scoutingAPI.send("generate-random-data");
    adown = false ;
    sdown = false ;
    ddown = false ;
    fdown = false ;
  }
});

const viewMap = new Map([
  ['empty', EmptyView],
  ['error', ErrorView],
  ['preview', PreviewFormView],
  ['info', InfoView],
  ['select-event', SelectEventView],
  ['assign-tablets', AssignTablets],
  ['edit-teams', EditTeamsView],
  ['edit-matches', EditMatchesView],
  ['teamform', TeamFormView],
  ['matchform', MatchFormView],
  ['teamstatus', TeamStatusView],
  ['matchstatus', MatchStatusView],
  ['teamdb', TeamDBView],
  ['matchdb', MatchDBView],
  ['teamgraph', TeamGraphView],
  ['zebramatchview', ZebraMatchView],
]) ;

async function updateMainWindow(mtype) {
  shutdownExistingView() ;
  setNewMainView(mtype) ;
}

function shutdownExistingView() {
  if (currentView) {
    currentView.close() ;
  }

  currentView = undefined ;
}

function setNewMainView(mtype) {
  let top = document.getElementById('rightcontent') ;

  if (viewMap.has(mtype)) {
    let viewtype = viewMap.get(mtype) ;
    currentView = new viewtype(top, mtype) ;
  }
  else {
    currentView = new TextView(top, 'Invalid View Requested - ' + mtype);
  }

  currentView.render() ;
}

function updateView(args) {
  let view = args[0] ;
  if (view === undefined) {
    updateMainWindow("error") ;
  }
  else if (args[0] === 'empty' && args.length > 1) {
    emptyView(args[1]) ;
  }
  else {
    updateMainWindow(view) ;
  }
}

document.addEventListener('DOMContentLoaded', function () {

    statusCreate() ;

    // Query the element
    const resizer = document.getElementById('dragMe');
    const leftSide = resizer.previousElementSibling;
    const rightSide = resizer.nextElementSibling;

    // The current position of mouse
    let x = 0;
    let y = 0;
    let leftWidth = 0;

    // Handle the mousedown event
    // that's triggered when user drags the resizer
    const mouseDownHandler = function (e) {
        // Get the current mouse position
        x = e.clientX;
        y = e.clientY;
        leftWidth = leftSide.getBoundingClientRect().width;

        // Attach the listeners to document
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = function (e) {
        // How far the mouse has been moved
        const dx = e.clientX - x;
        const dy = e.clientY - y;

        const newLeftWidth = ((leftWidth + dx) * 100) / resizer.parentNode.getBoundingClientRect().width;
        leftSide.style.width = newLeftWidth + '%';

        resizer.style.cursor = 'col-resize';
        document.body.style.cursor = 'col-resize';

        leftSide.style.userSelect = 'none';
        leftSide.style.pointerEvents = 'none';

        rightSide.style.userSelect = 'none';
        rightSide.style.pointerEvents = 'none';
    };

    const mouseUpHandler = function () {
        resizer.style.removeProperty('cursor');
        document.body.style.removeProperty('cursor');

        leftSide.style.removeProperty('user-select');
        leftSide.style.removeProperty('pointer-events');

        rightSide.style.removeProperty('user-select');
        rightSide.style.removeProperty('pointer-events');

        // Remove the handlers of mousemove and mouseup
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    // Attach the handler
    resizer.addEventListener('mousedown', mouseDownHandler);

    updateNav() ;
    updateView(["empty"]) ;
});

window.scoutingAPI.receive("update-main-window-view", (args)=>updateView(args)) ;
