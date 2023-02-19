import path = require('path');
import * as vscode from 'vscode';
import { DiagnosticHandler } from '../analysis/diagnostic-handler';
import { AnalysisDataModel } from '../contracts/analysis-data-model';
import { TestAnalysis } from "../analysis/test-analysis";
import { PluginAnalysis } from "../analysis/plugin-analysis";
import { DiagnosticCollection } from 'vscode';
import { Utilities } from './utilities';

enum BaseFolder {
    tests = 'Tests',
    plugins = 'Plugins'
}

export class StaticCodeAnalysis {
    // Members
    private context: vscode.ExtensionContext;
    private testAnalysis: TestAnalysis = new TestAnalysis();
    private pluginAnalysis: PluginAnalysis = new PluginAnalysis();
    private diagnosticHandler: DiagnosticHandler = DiagnosticHandler.getInstance();
    public diagnosticCollection: DiagnosticCollection = vscode.languages.createDiagnosticCollection('static-code-analysis');
    
    /**
     * Summary. Creates a new instance of VS Static Code Analysis for Rhino API.
     * 
     * @param context The context under which to trigger the analyzer.
     */
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public register () {
        // Setup trriger events
        vscode.workspace.onDidOpenTextDocument(doc => this.analyzer(doc));
        vscode.workspace.onDidChangeTextDocument(e => this.analyzer(e.document));

        // Trigger the 'analyzer' for all files
        this.analizeAll([BaseFolder.tests, BaseFolder.plugins]); 
    } 

    public analyzer (doc: vscode.TextDocument) {
        if(!doc.fileName.endsWith('.rhino')) {
            return;
        }

        // Setup
        let analyzeItems: AnalysisDataModel[];

        // Identify the file type (test, plugin etc.)
        let docUriStr: string = doc.uri.toString();
        let docUriArr: string[] = docUriStr.replace("file://", "").split("/");
        let baseFolder: string = docUriArr[docUriArr.indexOf("src") + 1];
        
        switch(baseFolder) {
            case BaseFolder.tests:
                analyzeItems = this.testAnalysis.testTags;
                break;
            case BaseFolder.plugins:
                analyzeItems = this.pluginAnalysis ? this.pluginAnalysis.getPluginParameters(doc) : [];
                break;
            default:
                analyzeItems = [];
                break;
        }

        const diagnostics = this.diagnosticHandler.getDiagnostics(doc, analyzeItems);
        this.diagnosticCollection.set(doc.uri, diagnostics);

        // Push all of the diagnostic that should be cleaned up when the extention is disabled
        this.context.subscriptions.push(this.diagnosticCollection);
    };

    public async analizeAll (baseFolders: BaseFolder[]) {
        baseFolders.forEach((baseFolder) => {
            // Get all files under the provided base folder
            let workspace = vscode.workspace.workspaceFolders?.map(folder => folder.uri.path)[0];
            workspace = workspace === undefined ? '' : workspace;
            let folderFullPath = path.join(workspace, baseFolder);
            folderFullPath = folderFullPath.startsWith('\\')
                ? folderFullPath.substring(1, folderFullPath.length)
                : folderFullPath;

            Utilities.getFiles(folderFullPath, (files: string[]) => {
                // Trigger the 'analyzer' for each file
                for (const file of files) {
                    vscode.workspace.openTextDocument(vscode.Uri.file(file)).then(doc => {
                        this.analyzer(doc);
                    });
                }
            });
        });
    } 
    
}