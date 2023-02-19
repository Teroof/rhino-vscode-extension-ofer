import { AnalysisDataModel } from "./../contracts/analysis-data-model";
import { AnalysisRules } from "./analysis-rules";

export class TestAnalysis {
    public testTags: AnalysisDataModel[] = [
        {
            value: "[test-id]",
            rules: [AnalysisRules.doesTagExist]
        },
        {
            value: "[test-scenario]",
            rules: [AnalysisRules.doesTagExist]
        },
        {
            value: "[test-categories]",
            rules: [AnalysisRules.doesTagExist]
        },
        {
            value: "[test-priority]",
            rules: [AnalysisRules.doesTagExist]
        },
        {
            value: "[test-severity]",
            rules: [AnalysisRules.doesTagExist]
        },
        {
            value: "[test-tolerance]",
            rules: [AnalysisRules.doesTagExist]
        },
        {
            value: "[test-owner]",
            rules: [AnalysisRules.doesTagExist]
        },
        {
            value: "[test-actions]",
            rules: [AnalysisRules.doesTagExist, AnalysisRules.hasLineSeperator]
        },
        {
            value: "[test-expected-results]",
            rules: [AnalysisRules.doesTagExist, AnalysisRules.hasLineSeperator]
        }
    ];
}