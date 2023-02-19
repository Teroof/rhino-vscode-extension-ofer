import * as vscode from 'vscode'; 
import { RhinoDocumentParser } from '../extensions/rhino-document-parser';
import { DiagnosticHandler } from './diagnostic-handler';

export class AnalysisRules {
    private static readonly diagnosticHandler = DiagnosticHandler.getInstance();

    // Test Tag Rule: validating that the provided tag is existing and not duplicate
    public static doesTagExist(fileContantArr: string[], tag: string): void {
        let tagRegx = new RegExp("\\" + tag, "gm");
        let count = fileContantArr.join().match(tagRegx)?.length;

        if (!count) {
            // Get the diagnostic item exact location
            let startLine = 0;
            let startIndex = 0;
            let endLine = fileContantArr.length;
            let endIndex = fileContantArr[fileContantArr.length - 1].length;

            AnalysisRules.diagnosticHandler.addNewDiagnosticItem( 
                "Tag: \"" + tag + "\" is missing",
                new vscode.Range(startLine, startIndex, endLine, endIndex),
                vscode.DiagnosticSeverity.Warning
            );
        } else if (count > 1) {
            let lastIndexOfTag = fileContantArr.lastIndexOf(tag);

            // Get the diagnostic item exact location
            let startLine = lastIndexOfTag;
            let startIndex = fileContantArr[startLine].indexOf('[');
            let endLine = lastIndexOfTag;
            let endIndex = fileContantArr[endLine].lastIndexOf(']');

            AnalysisRules.diagnosticHandler.addNewDiagnosticItem(   
                "Tag: \"" + tag + "\" is already exist",
                new vscode.Range(startLine, startIndex, endLine, endIndex),
                vscode.DiagnosticSeverity.Warning
            );
        }
    }

    // Test Tag Rule: validating that the provided tag have a white space line above it
    public static hasLineSeperator(fileContantArr: string[], tag: string): void {
        let firstIndexOfTag = fileContantArr.indexOf(tag);

        if (firstIndexOfTag !== -1) {
            if (firstIndexOfTag === 1 || fileContantArr[firstIndexOfTag-1] !== "") {
                // Get the diagnostic item exact location
                let startLine = firstIndexOfTag;
                let startIndex = fileContantArr[startLine].indexOf('[');
                let endLine = firstIndexOfTag;
                let endIndex = fileContantArr[endLine].lastIndexOf(']');

                AnalysisRules.diagnosticHandler.addNewDiagnosticItem(
                    "Tag: \"" + tag + "\" is missing a sapce line above",
                    new vscode.Range(startLine, startIndex, endLine, endIndex),
                    vscode.DiagnosticSeverity.Warning
                );
            }
        }
    }

    // Plugin Properties Rule: validating that all plugin's properties have usage at the plugin's action
    public static isParamUsed(fileContantArr: string[], parameter: string): void {
        let testActionSection = RhinoDocumentParser.getSection(fileContantArr, "test-actions");
        let pluginParamSection = RhinoDocumentParser.getSection(fileContantArr, "test-parameters");
        
        // Check if parameter is used
        if (!testActionSection?.lines.join().match("@" + parameter)) {
            // Put the "[test-parameters]"'s line as a default value
            const parametersTag = "[test-parameters]";
            let startLine = fileContantArr.indexOf(parametersTag);
            
            // Take the exact position of the parameter in the entire page
            let paramValueRegx = new RegExp("^\\|\\s*" + parameter + "\\s*\\|");
            let index = 0;
            if (pluginParamSection?.lines) {
                for (let line of pluginParamSection?.lines) {
                    if (line.match(paramValueRegx)) {
                        let paramSectionStartLine = pluginParamSection?.range.start.line;
                        if (paramSectionStartLine) {
                            startLine = paramSectionStartLine + index;
                            break;
                        }
                    }
                    index++;
                }          
            }

            // Defined the exact position  
            let startIndex = 0;
            let endLine = startLine;
            let endIndex = fileContantArr[endLine].length;

            AnalysisRules.diagnosticHandler.addNewDiagnosticItem(
                "Parameter: \"" + parameter + "\" is unused",
                new vscode.Range(startLine, startIndex, endLine, endIndex),
                vscode.DiagnosticSeverity.Warning
            );
        }
    }
}