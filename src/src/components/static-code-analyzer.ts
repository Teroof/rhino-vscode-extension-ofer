import * as fs from 'fs';
import * as vscode from 'vscode';
import path = require('path');
import { Logger } from '../logging/logger';
import { ExtensionLogger } from '../logging/extensions-logger';
import { Channels } from '../constants/channels';
import { TmLanguageCreateModel } from '../models/tm-create-model';
import { DocumentData, FormattedRangeMap } from '../models/code-analysis-models';
import { commentRegex, multilineRegex } from '../formatters/formatConstants';



export class StaticCodeAnalyzer {
    private readonly _createModel: TmLanguageCreateModel | Promise<TmLanguageCreateModel>;
    private readonly _context: vscode.ExtensionContext;
    private readonly _diagnosticCollection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection('rhino');
    private readonly _diagnosticModels: DiagnosticModel[];
    private readonly _logger: Logger;
    private fileUris: vscode.Uri[] = [];
    /**
     * Summary. Creates a new instance of VS Static Code Analysis for Rhino API.
     * 
     * @param context The context under which to trigger the analyzer.
     */
    constructor(context: vscode.ExtensionContext, createModel: TmLanguageCreateModel | Promise<TmLanguageCreateModel>) {
        this._createModel = createModel;
        this._context = context;
        this._diagnosticModels = [];
        this._logger = new ExtensionLogger(Channels.extension, 'StaticCodeAnalyzer');
    }

    public register() {
        this.initialAnalyzer();
        vscode.workspace.onDidOpenTextDocument(document => this.analyzer(document));
        vscode.workspace.onDidChangeTextDocument(e => this.analyzer(e.document));
    }

    public async initialAnalyzer(){
        
        this.fileUris = await vscode.workspace.findFiles('**/*.rhino');
        this.fileUris.forEach(async (uri) => {
            
            let document = await vscode.workspace.openTextDocument(uri);
            this.analyzer(document);
        });
    }
    public async analyzer(doc: vscode.TextDocument) {
        // exit conditions
        const isRhino = doc.fileName.endsWith('.rhino');
        const isRhinoModel = doc.fileName.endsWith('.rmodel');
        if (!isRhino && !isRhinoModel) {
            return;
        }

        // setup
        let rules = this.resolveRules();
        const diagnostics: vscode.Diagnostic[] = [];

        // identify file type
        const isModelType = isRhinoModel;
        const isTestType = doc.fileName.match(/(\\|\/)+src(\\|\/)+Tests/) !== null || doc.fileName.endsWith(".rhino");
        const isPluginType = doc.fileName.match(/(\\|\/)+src(\\|\/)+Plugins/) !== null || doc.fileName.endsWith(".rplugin");

        // filter
        if (isModelType) {
            rules = rules.filter(i => i.entities?.includes("Model"));
        }
        else if (isPluginType) {
            rules = rules.filter(i => i.entities?.includes("Plugin"));
        }
        else if (isTestType) {
            rules = rules.filter(i => i.entities?.includes("Test"));
        }

        // build
        for (const rule of rules) {
            const diagnostic = this.newDiagnostics(rule, doc);
            diagnostics.push(...(await diagnostic));
        }

        // register
        this._diagnosticCollection.set(doc.uri, diagnostics);
        this._context.subscriptions.push(this._diagnosticCollection);
    }

    private async newDiagnostics(diagnosticModel: DiagnosticModel, document: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
        const diagnostics = diagnosticModel.multiline
            ? await this.resolveMultilineRule(diagnosticModel, document)
            : await this.resolveSinglelineRule(diagnosticModel, document);

        // get
        return diagnostics;
    }

    private mergeRhinoMultilines(section: DocumentData): DocumentData{
        let lines:string[] = [];

        for(let sectionLine = 0; sectionLine < section.lines.length; sectionLine++){
            let line = section.lines[sectionLine];
            
            let previousLineNumber = sectionLine - 1 < 0 ? 0 : sectionLine - 1;

            let previousLine = section.lines[previousLineNumber];
            let isMatch = line.trim().match(multilineRegex) !== null;

            let isPreviousMatch = previousLine.trim().match(multilineRegex) !== null;
            let isMultiline = isMatch && isPreviousMatch || (!isMatch && isPreviousMatch);

            let formattedSectionLineNumber: number;
            let endCharacterIndex: number;
            if(isMultiline){
                formattedSectionLineNumber = lines.length - 1;
                let multiLine = lines[formattedSectionLineNumber];

                line = " " + line.replace(multilineRegex, "");
                multiLine = multiLine.replace(multilineRegex, "") + line;
                lines[formattedSectionLineNumber] = multiLine;
            }
            else{
                formattedSectionLineNumber = lines.length;
                lines.push(line);
            }
            endCharacterIndex = lines[formattedSectionLineNumber].length;
            let formattedRange: FormattedRangeMap = {
                actualLine: sectionLine + section.range.start.line,
                formattedPosition: new vscode.Position(formattedSectionLineNumber + section.range.start.line, endCharacterIndex)
            };
            if(!section?.formattedRange){
                section.formattedRange = [];
            }
            section.formattedRange.push(formattedRange);
        }
        section.lines = lines;
        return section;
    }
    // TODO: figure how to get range
    private async resolveSinglelineRule(diagnosticModel: DiagnosticModel, document: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
        // exit conditions
        if (!document) {
            return [];
        }

        // setup
        const diagnostics: vscode.Diagnostic[] = [];
        const documentData = this.getDocumentData(document);
        
        const sections: DocumentData[] = await this.getDocumentSections(documentData, diagnosticModel.sections);
        
        // merge Rhino multilines
        sections.forEach(section => section = this.mergeRhinoMultilines(section));
        // {
        //     let lines:string[] = [];

        //     for(let sectionLine = 0; sectionLine < section.lines.length; sectionLine++){
        //         let line = section.lines[sectionLine];
                
        //         let previousLineNumber = sectionLine - 1 < 0 ? 0 : sectionLine - 1;

        //         let previousLine = section.lines[previousLineNumber];
        //         let isMatch = line.trim().match(multilineRegex) !== null;

        //         let isPreviousMatch = previousLine.trim().match(multilineRegex) !== null;
        //         let isMultiline = isMatch && isPreviousMatch || (!isMatch && isPreviousMatch);

        //         let formattedSectionLineNumber: number;
        //         let endCharacterIndex: number;
        //         if(isMultiline){
        //             formattedSectionLineNumber = lines.length - 1;
        //             let multiLine = lines[formattedSectionLineNumber];

        //             line = " " + line.replace(multilineRegex, "");
        //             multiLine = multiLine.replace(multilineRegex, "") + line;
        //             lines[formattedSectionLineNumber] = multiLine;
        //         }
        //         else{
        //             formattedSectionLineNumber = lines.length;
        //             lines.push(line);
        //         }
        //         endCharacterIndex = lines[formattedSectionLineNumber].length;
        //         let formattedRange: FormattedRangeMap = {
        //             actualLine: sectionLine + section.range.start.line,
        //             formattedPosition: new vscode.Position(formattedSectionLineNumber + section.range.start.line, endCharacterIndex)
        //         };
        //         if(!section?.formattedRange){
        //             section.formattedRange = [];
        //         }
        //         section.formattedRange.push(formattedRange);
        //     }
        //     section.lines = lines;
        // });

        // iterate
        sections.forEach(section => {
            for (let i = 0; i < section.lines.length; i++) {
                const line = section.lines[i];
                if(line.match(commentRegex)){
                    continue;
                }
                const isNegative = diagnosticModel.type.toUpperCase() === 'NEGATIVE';
                const isPositive = diagnosticModel.type.toUpperCase() === 'POSITIVE';
                let formattedLineNumber = section.range.start.line + i;
                let formattedRange = section.formattedRange?.filter(r => r.formattedPosition.line === formattedLineNumber);
                if (isNegative) {
                    let collection = this.assertNegative(diagnosticModel, formattedLineNumber, line, formattedRange);
                    diagnostics.push(...collection);
                }
                else if (isPositive) {
                    let collection = this.assertPositive(diagnosticModel, formattedLineNumber, line, formattedRange);
                    diagnostics.push(...collection);
                }
            }
        });

        // get
        return diagnostics;
    }

    private getDocumentData(document: vscode.TextDocument){
        const documentData = {
            lines: document.getText().split(/\r?\n|\n\r?/),
            range: this.getDocumentRange(document),
            formattedRange: []
        };

        return documentData;
    }

    private async getDocumentSections(documentData: DocumentData, sections: string[] | undefined): Promise<DocumentData[]>{
        const annotations = (await this._createModel).annotations;
        const documentSections: DocumentData[] = !sections
            ? [documentData]
            // flatMap to remove 'undefined' results
            : sections.flatMap((section) => {
                let doc = this.getSection(documentData.lines, section, annotations);
                return doc ? doc : [];
            });

        return documentSections;
    }
    // TODO: optimize complexity
    private async resolveMultilineRule(diagnosticModel: DiagnosticModel, document: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
        // exit conditions
        if (!document) {
            return [];
        }

        // setup
        const diagnostics: vscode.Diagnostic[] = [];
        const documentData = this.getDocumentData(document);
        
        const sections: DocumentData[] = await this.getDocumentSections(documentData, diagnosticModel.sections);

        // iterate
        sections.forEach(section => {
            for (let i = 0; i < section.lines.length; i++) {
                const line = section.lines[i];
                if(line.match(commentRegex)){
                    continue;
                }
                const isNegative = diagnosticModel.type.toUpperCase() === 'NEGATIVE';
                const isPositive = diagnosticModel.type.toUpperCase() === 'POSITIVE';
                let formattedLineNumber = section.range.start.line + i;
                let formattedRange = section.formattedRange?.filter(r => r.formattedPosition.line === formattedLineNumber);
                if (isNegative) {
                    let collection = this.assertNegative(diagnosticModel, formattedLineNumber, line, formattedRange);
                    diagnostics.push(...collection);
                }
                else if (isPositive) {
                    let collection = this.assertPositive(diagnosticModel, formattedLineNumber, line, formattedRange);
                    diagnostics.push(...collection);
                }
            }
        });

        // get
        return diagnostics;
    }

    private assertNegative(diagnosticModel: DiagnosticModel, lineNumber: number, line: string, formattedRange: FormattedRangeMap[] | undefined): vscode.Diagnostic[] {
        // exit conditions
        
        if (line.match(diagnosticModel.expression)) {
            return [];
        }
        
            let sortedRange = formattedRange && formattedRange.length > 1 ? formattedRange.sort((r1,r2) => r1.actualLine - r2.actualLine) : undefined;
            let actualStartLine = sortedRange ? sortedRange[0].actualLine : lineNumber;
            let actualEndLine = sortedRange ? sortedRange[sortedRange.length - 1].actualLine : lineNumber;
            let actualEndCharacter = sortedRange ? sortedRange[sortedRange.length - 1].formattedPosition.character : line.length;
    
            // setup
            const start = new vscode.Position(actualStartLine, 0);
            const end = new vscode.Position(actualEndLine, actualEndCharacter);
            const range = new vscode.Range(start, end);
            const diagnostic = this.populateDiagnosticModel(range, diagnosticModel);
        

            // get
            return [diagnostic];
    }

    private assertPositive(diagnosticModel: DiagnosticModel, lineNumber: number, line: string, formattedRange: FormattedRangeMap[] | undefined) {
        // setup
        const diagnostics: vscode.Diagnostic[] = [];

        // iterate
        let result;
        while (result = diagnosticModel.expression.exec(line)) {

            let start = new vscode.Position(lineNumber, result.index);
            let end = new vscode.Position(lineNumber, result.index + result[0].length);
            if(formattedRange && formattedRange.length > 0){
                if(formattedRange.length === 1){
                    let actualLine = formattedRange[0].actualLine;
                    let actualStartCharacter = result.index;
                    let actualEndCharacter = result.index + result[0].length;

                    start = new vscode.Position(actualLine, actualStartCharacter);
                    end = new vscode.Position(actualLine, actualEndCharacter);    
                }
                let sortedRange = formattedRange.sort((r1,r2) => r1.actualLine - r2.actualLine);
                for(let item of sortedRange){
                    if(item.formattedPosition.character < result.index){
                        let actualLine = item.actualLine;
                        let actualStartCharacter = result.index - item.formattedPosition.character;
                        let actualEndCharacter = actualStartCharacter + result[0].length;

                        start = new vscode.Position(actualLine, actualStartCharacter);
                        end = new vscode.Position(actualLine, actualEndCharacter);
                        break;
                    }
                }
            }

            const range = new vscode.Range(start, end);
            const diagnostic = this.populateDiagnosticModel(range, diagnosticModel);

            diagnostics.push(diagnostic);
        }

        // get
        return diagnostics;
    }


    private populateDiagnosticModel(range: vscode.Range, diagnosticModel: DiagnosticModel) {
        const diagnostic = new vscode.Diagnostic(range, diagnosticModel.description, diagnosticModel.severity);

        if (diagnosticModel?.code) {
            diagnostic.code = {
                target: vscode.Uri.parse(diagnosticModel.code.target),
                value: diagnosticModel.code.value
            };
        }
        return diagnostic;
    }

    private getDocumentRange(document: vscode.TextDocument) {
        // setup
        var firstLine = document.lineAt(0);
        var lastLine = document.lineAt(document.lineCount - 1);

        // get
        return new vscode.Range(firstLine.range.start, lastLine.range.end);
    }

    //#region *** Read Rules Files ***
    private resolveRules(): DiagnosticModel[] {
        const diagnosticModels: DiagnosticModel[] = [];
        try {
            // setup
            const rootPath = path.resolve(__dirname, '../..');
            const directoryPath = path.join(rootPath, 'rules');
            const files = fs.readdirSync(directoryPath);

            // build
            for (const file of files) {
                const filePath = path.join(directoryPath, file);
                const models = this.convertFromFile(filePath);
                diagnosticModels.push(...models);
            }
        } catch (error: any) {
            this._logger.error('Resolve-Rules = (InternalServerError)', '-1', error);
        }

        // default
        return diagnosticModels;
    }

    private convertFromFile(filePath: string): DiagnosticModel[] {
        try {
            // setup
            const modelsData = fs.readFileSync(filePath, 'utf8');
            const models = JSON.parse(modelsData);
            const diagnosticModels: DiagnosticModel[] = [];

            // build
            for (const model of models) {
                const diagnosticModel = this.convertFromEntry(model);

                if (diagnosticModel === undefined) {
                    continue;
                }

                diagnosticModels.push(diagnosticModel);
            }

            // get
            return diagnosticModels;
        } catch (error: any) {
            const message = `ConvertFrom-File -FilePath ${filePath} = (InternalServerError)`;
            this._logger.error(message, '-1', error);
            return [];
        }
    }

    private convertFromEntry(entry: any): DiagnosticModel | undefined {
        try {
            // setup
            const model = new DiagnosticModel();
            model.type = entry.type;
            model.description = entry.description;
            model.expression = new RegExp(entry.expression, 'g');
            model.id = entry.id;
            model.multiline = entry?.multiline ? entry.multiline : false;
            model.sections = entry.sections;
            model.severity = StaticCodeAnalyzer.getSeverity(entry.severity);
            model.entities = entry.entities;
            model.code = entry.code;

            // get
            return model;
        } catch (error: any) {
            const message = `ConvertFrom-Entry = (InternalServerError)`;
            this._logger.error(message, '-1', error);
            return undefined;
        }
    }

    private static getSeverity(severity: string): vscode.DiagnosticSeverity {
        switch (severity.toUpperCase()) {
            case 'ERROR':
                return vscode.DiagnosticSeverity.Error;
            case 'HINT':
                return vscode.DiagnosticSeverity.Hint;
            case 'INFORMATION':
                return vscode.DiagnosticSeverity.Information;
            case 'WARNING':
                return vscode.DiagnosticSeverity.Warning;
            default:
                return vscode.DiagnosticSeverity.Hint;
        }
    }
    //#endregion

    /*┌─[ UTILITIES ]──────────────────────────────────────────
      │
      │ A collection of utility methods
      └────────────────────────────────────────────────────────*/
    private getSection(document: string[], annotation: string, annotations: any[]): DocumentData | undefined{
        try {
            // bad request
            if (!annotations) {
                return;
            }

            // setup
            let lines: string[] = [];
            let map = annotations.map((i) => i.key).filter((i) => i !== annotation);
            let pattern = map.map((i) => '^\\[' + i + ']').join('|');
            let testPattern = '^\\[' + annotation + ']';

            // get line number
            let onLine = 0;
            for (onLine; onLine < document.length; onLine++) {
                if (document[onLine].match(testPattern) !== null) {
                    break;
                }
            }
            let start = new vscode.Position(onLine, 0);

            // iterate
            while (onLine < document.length) {
                if (document[onLine].match(pattern)) {
                    break;
                }
                lines.push(document[onLine]);
                onLine += 1;
            }
            let end = new vscode.Position(onLine - 1, 0);

            // default
            return {
                lines: lines,
                range: new vscode.Range(start, end)
            };
        } catch (error) {
            console.error(error);
            return;
        }
    }
}

export class DiagnosticModel {
    public type: string;
    public code?: Code;
    public description: string;
    public expression: RegExp;
    public id: string;
    public multiline: boolean;
    public sections?: string[];
    public severity: vscode.DiagnosticSeverity;
    public source?: string;
    public tags?: vscode.DiagnosticTag;
    public entities: ("Plugin" | "Test" | "Model")[];

    constructor() {
        this.type = 'positive';
        this.description = '';
        this.expression = new RegExp(/.*/);
        this.id = '';
        this.multiline = true;
        this.severity = vscode.DiagnosticSeverity.Hint;
        this.entities = [];
    }
}

class Code {
    public target: string = '';
    public value: string = '';
}
