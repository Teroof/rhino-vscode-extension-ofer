import { AnalysisDataModel } from '../contracts/analysis-data-model';
import * as vscode from 'vscode'; 

export class DiagnosticHandler {
    private diagnosticItems: vscode.Diagnostic[] = [];
    private static instance = new DiagnosticHandler(); 

    private constructor() {
      // private to prevent anyone else from instantiating
    }

    public static getInstance(): DiagnosticHandler {
        return DiagnosticHandler.instance;
    }

    // Invoke the rules for each item and return all diagnostics
    public getDiagnostics(doc: vscode.TextDocument, analysisItems: AnalysisDataModel[]): vscode.Diagnostic[] {
        // Setup
        this.clearDiagnostics();
        const fileContent = doc.getText();
        let fileContantArr: string[] = fileContent.split(/\r\n|\n/); 
        
        // Invoke
        analysisItems.forEach( item => {
           item.rules.forEach( rule => {
               rule(fileContantArr, item.value);
           }) ;   
        }) ; 

        return this.diagnosticItems;
    }

    // Add new diagnostic item to the diagnostic collection
    public addNewDiagnosticItem(message: string, position: vscode.Range, severity: vscode.DiagnosticSeverity): void {
        this.diagnosticItems.push({
            severity: severity,
            message: message,
            code: 'rhino-static-code-analysis',
            source: 'rhino-language-support',
            range: position
        });
    } 

    // Clear the diagnostic items array
    public clearDiagnostics() {
        this.diagnosticItems = [];
    } 
}
