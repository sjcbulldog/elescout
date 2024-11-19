
class GraphBaseView extends XeroView {

}

class TeamGraphView extends GraphBaseView {
    constructor(div, viewtype) {
        super(div, viewtype);
        this.buildInitialView("Retreiving data for the graph view, Please wait ....");
        this.registerCallback('send-team-graph-data', this.formCallback.bind(this));
        window.scoutingAPI.send("get-team-graph-data");
    }

    createGraph(div) {
      var options = {
        series: [{
        data: [400, 430, 448, 470, 540, 580, 690, 1100, 1200, 1380]
      }],
        chart: {
        type: 'bar',
        height: 350
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          borderRadiusApplication: 'end',
          horizontal: true,
        }
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: ['South Korea', 'Canada', 'United Kingdom', 'Netherlands', 'Italy', 'France', 'Japan',
          'United States', 'China', 'Germany'
        ],
      }
      };

      var chart = new ApexCharts(document.querySelector("#chart"), options);
      chart.render();
    }

    formCallback(arg) {
        this.reset();

        this.top_div_ = document.createElement('div') ;
        this.top_.append(this.top_div_) ;

        this.createGraph(this.top_div_) ;
    }
}

window.scoutingAPI.receive("send-team-graph-data", (args) => { XeroView.callback_mgr_.dispatchCallback('send-team-graph-data', args); });