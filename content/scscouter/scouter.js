

async function updateEventName(args) {
  let str = args[0] + "<br>" + args[1] ;
  emptyView(str) ;
}

async function updateMainWindow(mtype) {
  mainwintype = mtype;

  if (mainwintype === "empty") {
    emptyView("No Event Loaded");
  }
  else if (mainwintype === "error") {
    emptyView("Internal Error Occurred");
  }
  else if (mainwintype === "select-tablet") {
    selectTabletView();
  }
  else if (mainwintype === 'team-form') {
    teamFormView();
  }
  else if (mainwintype === 'match-form') {
    matchFormView();
  }
  else {
    emptyView(mainwintype) ;
  }
}

document.addEventListener('DOMContentLoaded', function () {

  statusCreate();

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

  updateNav();
  updateView(["empty"]);

  updateTabletTitle('Waiting ...')
});

function updateView(args) {
  let view = args[0];
  if (view === undefined) {
    updateMainWindow("error");
  }
  else {
    updateMainWindow(view);
  }
}

function updateTabletTitle(title) {
  document.title = 'Xero Scout - ' + title ;
}

window.scoutingAPI.receive("update-main-window-view", (args) => updateView(args));
window.scoutingAPI.receive("event-name", (args) => updateEventName(args));
window.scoutingAPI.receive("tablet-title", (args) => updateTabletTitle(args));
