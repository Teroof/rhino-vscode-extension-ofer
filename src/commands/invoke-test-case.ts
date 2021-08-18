/*
 * CHANGE LOG - keep only last 5 threads
 * 
 * RESOURCES
 * https://stackoverflow.com/questions/45203543/vs-code-extension-api-to-get-the-range-of-the-whole-text-of-a-document
 * https://code.visualstudio.com/api/references/icons-in-labels
 * https://stackoverflow.com/questions/55633453/rotating-octicon-in-statusbar-of-vs-code
 * https://code.visualstudio.com/api/extension-guides/webview
 */
import * as vscode from 'vscode';
import { ReportManager } from '../rhino/report-manager';
import { Command } from "./command";
import { FormatTestCaseCommand } from './format-document';

export class InvokeTestCasesCommand extends Command {
    // members
    private testCases: string[];

    /**
     * Summary. Creates a new instance of VS Command for Rhino API.
     * 
     * @param context The context under which to register the command.
     */
    constructor(context: vscode.ExtensionContext) {
        super(context);

        // setup
        this.testCases = [];
        this.setCommandName('Invoke-TestCase');
    }

    /*┌─[ SETTERS ]────────────────────────────────────────────
      │
      │ A collection of functions to set object properties
      │ to avoid initializing members in the object signature.
      └────────────────────────────────────────────────────────*/
    /**
     * Summary. Adds one or more Rhino Test Case(s) into the tests collection.
     * 
     * @param testCases One or more Rhino Test Case(s) to invoke.
     * @returns Self reference
     */
    public addTestCases(...testCases: string[]): InvokeTestCasesCommand {
        // build
        this.testCases.push(...testCases);

        // get
        return this;
    }

    /**
     * Summary. Adds one or more Rhino Test Case(s) into the tests collection.
     * 
     * @returns Self reference
     */
    public addOpenTestCases(): InvokeTestCasesCommand {
        // setup
        var editor = vscode.window.activeTextEditor;

        // bad request
        if (!editor) {
            return this;
        }

        // build
        var testCases = editor.document.getText().split('>>>');
        this.testCases.push(...testCases);

        // get
        return this;
    }

    /*┌─[ REGISTER ]───────────────────────────────────────────
      │
      │ A command registration pipeline to expose the command
      │ in the command interface (CTRL+SHIFT+P).
      └────────────────────────────────────────────────────────*/
    /**
     * Summary. Register a command for invoking one or more Rhino Test Case
     *          and present the report.
     */
    public register(): any {
        // setup
        var command = vscode.commands.registerCommand(this.getCommandName(), () => {
            this.invoke();
        });

        // set
        this.getContext().subscriptions.push(command);
    }

    /**
     * Summary. Implement the command invoke pipeline.
     */
    public invokeCommand() {
        this.invoke();
    }

    private invoke() {
        // setup
        var context = this.getContext();

        // notification
        vscode.window.setStatusBarMessage('$(sync~spin) Invoking test case(s)...');

        // format
        new FormatTestCaseCommand(context).invokeCommand(() => {
            // invoke
            this.getRhinoClient().invokeConfiguration(this.getConfiguration(), (testRun: any) => {
                var _testRun = JSON.parse(testRun);
                _testRun.actual === true
                    ? vscode.window.setStatusBarMessage("$(testing-passed-icon) Invoke completed w/o test(s) failures")
                    : vscode.window.setStatusBarMessage("$(testing-error-icon) Invoke completed, w/ test(s) failures");

                console.info(testRun);
                try {
                    const panel = vscode.window.createWebviewPanel("RhinoReport", "Rhino Report", vscode.ViewColumn.One);
                    panel.webview.html = new ReportManager(_testRun).getHtmlReport();
                } catch (error) {
                    console.error(error);
                    vscode.window.setStatusBarMessage("$(testing-error-icon) Invoke was not completed");
                }
            });
        });
    }

    // creates default configuration with text connector
    private getConfiguration() {
        // setup
        var projectManifest = this.getProjectManifest();
        var testsRepository = this.getCommandName() === 'Invoke-TestCase'
            ? this.getOpenTestCases()
            : this.testCases;

        // build
        return {
            name: "VS Code - Stand Alone Test Run",
            testsRepository: testsRepository,
            driverParameters: projectManifest.driverParameters,
            authentication: projectManifest.authentication,
            screenshotsConfiguration: {
                keepOriginal: false,
                returnScreenshots: false,
                onExceptionOnly: false
            },
            reportConfiguration: {
                reporters: [
                    "ReporterBasic"
                ],
                archive: false,
                localReport: true,
                addGravityData: true
            },
            engineConfiguration: {
                maxParallel: projectManifest.engineConfiguration.maxParallel
            }
        };
    }

    // get test cases from the open document
    private getOpenTestCases(): string[] {
        // setup
        var editor = vscode.window.activeTextEditor;

        // bad request
        if (!editor) {
            return [];
        }

        // clean
        var text = editor.document.getText().split('\n').map(i => i.replace(/^\d+\.\s+/, '')).join('\n');

        // get
        return text.split('>>>');
    }
}