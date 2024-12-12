import Matrix from "ml-matrix";
import { MatchDataModel } from "../model/matchmodel";
import { TeamDataModel } from "../model/teammodel";
import { SCBase } from "../apps/scbase";

export class OPRCalculator {
    private teams_ : TeamDataModel ;
    private matches_ : MatchDataModel ;

    constructor(team: TeamDataModel, match: MatchDataModel) {
        this.teams_ = team ;
        this.matches_ = match ;
    }

    // Rows equal number of matches times two
    public async compute() : Promise<number[]> {
        let ret = new Promise<number[]>(async (resolve, reject) => {
            let [mm,sm] = await this.getMatchesMatrix() ;
            let mt = mm.transpose() ;
            let rt = mt.multiply(sm) ;
            let mp = mt.multiply(mm) ;

            // MatrixXd mt = m.transpose();
            // MatrixXd rt = mt * scores;
            // MatrixXd mp = mt * m;
            // MatrixXd mpinv = mp.completeOrthogonalDecomposition().pseudoInverse();
            // MatrixXd opr = mpinv * rt;
            let opr : number[] = new Array(mm.columns).fill(0.0) ;
            resolve(opr) ;
        }) ;
        return ret ;
    }

    // comp_level, set_number, match_number, ba_redscore, ba_bluescore
    private collectMatchScores(matches: any[]) : number[][] {
        let ret : number[][] = [] ;
        let seen: Set<string> = new Set<string>() ;

        for(let match of matches) {
            let tag = match.comp_level + '-' + match.set_number + '-' + match.match_number ;
            if (seen.has(tag)) {
                continue ;
            }
            seen.add(tag) ;

            if (match.ba_bluescore && match.ba_redscore) {
                let blue : number[] = [] ;
                blue.push(SCBase.keyToTeamNumber(match.b1)) ;
                blue.push(SCBase.keyToTeamNumber(match.b2)) ;
                blue.push(SCBase.keyToTeamNumber(match.b3)) ;
                blue.push(match.ba_bluescore) ;
                ret.push(blue) ;

                let red : number[] = [] ;
                red.push(SCBase.keyToTeamNumber(match.r1)) ;
                red.push(SCBase.keyToTeamNumber(match.r2)) ;
                red.push(SCBase.keyToTeamNumber(match.r3)) ;
                red.push(match.ba_redscore) ;
                ret.push(red) ;
            }
        }

        return ret ;
    }

    private getMatchesMatrix() : Promise<[Matrix, Matrix]> {
        let ret = new Promise<[Matrix,Matrix]>((resolve, reject) => {
            this.matches_.getAllData(MatchDataModel.MatchTableName)
                .then((matchdata) => {
                    this.teams_.getAllData(TeamDataModel.TeamTableName)
                        .then((teamdata) => {
                            let matches = this.collectMatchScores(matchdata) ;
                            let teamindexes = [] ;
                            for(let team of teamdata) {
                                teamindexes.push(team.team_number) ;
                            }

                            let mm: Matrix = Matrix.zeros(matches.length, teamdata.length) ;
                            let sm: Matrix = Matrix.zeros(matches.length, 1) ;

                            let row = 0 ;
                            for (let match of matches) {
                                for(let ti = 0 ; ti < 3 ; ti++) {
                                    let index = teamindexes.indexOf(match[ti]);
                                    mm.set(row, index, 1) ;
                                }
                                sm.set(row, 0, match[3]) ;
                                row++ ;
                            }

                            resolve([mm, sm]) ;
                        })
                        .catch((err) => {
                            reject(err) ;
                        })
                })
                .catch((err) => {
                    reject(err) ;
                })  ;
        }) ;
        return ret;
    }
}