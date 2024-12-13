let currentView = undefined ;

const viewMap = new Map([
  ['empty', EmptyView],
  ['error', ErrorView],
  ['info', InfoView],
  ['select-event', SelectEventView],
  ['assign-tablets', AssignTabletsView],
  ['edit-teams', EditTeamsView],
  ['edit-matches', EditMatchesView],
  ['formview', FormView],
  ['teamstatus', TeamStatusView],
  ['matchstatus', MatchStatusView],
  ['teamdb', TeamDBView],
  ['matchdb', MatchDBView],
  ['teamgraph', GraphView],
  ['zebraview', ZebraView],
  ['picklist', PickListView],
  ['singleteam', SingleTeamView],
  ['zebrastatus', ZebraStatusView],
]) ;

async function updateMainWindow(mtype, args) {
  shutdownExistingView() ;
  setNewMainView(mtype, args) ;
}

function shutdownExistingView() {
  if (currentView) {
    currentView.close() ;
  }

  currentView = undefined ;
}

function setNewMainView(mtype, args) {
  let top = document.getElementById('rightcontent') ;

  if (viewMap.has(mtype)) {
    let viewtype = viewMap.get(mtype) ;
    currentView = new viewtype(top, mtype, args) ;
  }
  else {
    currentView = new TextView(top, 'Invalid View Requested - ' + mtype);
  }
}

function updateView(args) {
  let view = args[0] ;

  window.scoutingAPI.send('client-log', { type: 'debug', message: 'update-view called', args: args }) ;

  if (view === undefined) {
    updateMainWindow("error") ;
  }
  else {
    updateMainWindow(view, args) ;
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

window.addEventListener('error', (e) => {
  window.scoutingAPI.send('client-log', { type: 'error', message: 'window reported an error', args: JSON.stringify(e) }) ;
}) ;