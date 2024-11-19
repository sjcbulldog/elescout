class GraphBaseView extends XeroView {

}

class TeamGraphBaseView extends GraphBaseView {
    constructor(div, viewtype) {
        super(div, viewtype);

    }

    createGraph(ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Category 1', 'Category 2', 'Category 3'],
          datasets: [
            {
              label: 'Dataset 1',
              data: [12, 19, 3],
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1
            },
            {
              label: 'Dataset 2',
              data: [10, 5, 8],
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          scales: {
            x: {
              stacked: false // Set to 'true' for stacked bar chart
            },
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    formCallback(arg) {
        this.reset();

        this.top_div_ = document.createElement('div') ;
        this.canvas_ = document.createElement('canvas') ;
        this.top_div_.append(this.canvas_) ;
        this.top_.append(this.top_div_) ;

        this.createGraph(this.canvas_) ;
    }
}

class TeamGraphView extends TeamGraphBaseView {
  constructor(div, viewtype) {
    super(div, viewtype) ;

    this.buildInitialView("Retreiving data for the graph view, Please wait ....");
    this.registerCallback('send-team-graph-data', this.formCallback.bind(this));
    window.scoutingAPI.send("get-team-graph-data", []) ;
  }
}

window.scoutingAPI.receive("send-team-graph-data", (args) => { XeroView.callback_mgr_.dispatchCallback('send-team-graph-data', args); });