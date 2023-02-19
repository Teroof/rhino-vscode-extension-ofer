import { AnalysisDataModel } from "./../contracts/analysis-data-model";
import { AnalysisRules } from "./analysis-rules";
import * as vscode from 'vscode'; 
import { RhinoDocumentParser } from "./../extensions/rhino-document-parser";
import * as os from 'os';

export class PluginAnalysis {
    public getPluginParameters(doc: vscode.TextDocument): AnalysisDataModel[] {
        // Setup
        let pluginParameters: AnalysisDataModel[] = [];
        let pluginContentStr: string = doc.getText();
        let pluginContentArr: string[] = pluginContentStr.split(/\r\n|\n/gm);
 
        // Get the 'test-parameters' section from the plugin
        let pluginParamSection = RhinoDocumentParser.getSection(pluginContentArr, "test-parameters");

        // Extract only the left column (parameters column) values into an array
        let leftColumn = /(?<=^\|\s*)\S.*?(?=\s*\|)/gm;
        let parameters = pluginParamSection?.lines.join(os.EOL).match(leftColumn);

        // Delete the column title in order to saty only with the params values
        if (parameters) {
            let index = 0;
            for(let parameter of parameters) {
                if (parameter.match(/^-+$/)) {
                    parameters?.splice(0, index+1);
                    break;
                }
                index++;
            }
        }

        // Return an analysis items array, initiate with all plugin's parameters and rules 
        parameters?.forEach(parameter => {
            pluginParameters.push({
                value: parameter,
                rules: [AnalysisRules.isParamUsed]
            });
        });
    
        return pluginParameters;
    }
}