// Temp workaround until annotations is stored to be globaly 
export const annotations = [
    {
        "key": "test-id",
        "literal": "[test-id]",
        "verb": "",
        "entity": {
            "name": "test-id",
            "description": "A _*unique*_ identifier of the test case. Must not include spaces, escape or special characters - excluding dash and underscore.",
            "priority": 0
        }
    },
    {
        "key": "test-scenario",
        "literal": "[test-scenario]",
        "verb": "",
        "entity": {
            "name": "test-scenario",
            "description": "A statement describing the functionality to be tested. Must not include spaces, escape or special characters - excluding dash and underscore.",
            "priority": 1
        }
    },
    {
        "key": "test-categories",
        "literal": "[test-categories]",
        "verb": "",
        "entity": {
            "name": "test-categories",
            "description": "A comma separated list of categories to which this test belongs to.Must not include spaces, escape or special characters - excluding dash and underscore.",
            "priority": 2
        }
    },
    {
        "key": "test-priority",
        "literal": "[test-priority]",
        "verb": "",
        "entity": {
            "name": "test-priority",
            "description": "The level of _*business importance*_ assigned to an item, e.g., defect.Must not include spaces, escape or special characters - excluding dash and underscore.",
            "priority": 3
        }
    },
    {
        "key": "test-severity",
        "literal": "[test-severity]",
        "verb": "",
        "entity": {
            "name": "test-severity",
            "description": "The degree of _*impact*_ that a defect has on the development or operation of a component or system.Must not include spaces, escape or special characters - excluding dash and underscore.",
            "priority": 4
        }
    },
    {
        "key": "test-tolerance",
        "literal": "[test-tolerance]",
        "verb": "",
        "entity": {
            "name": "test-tolerance",
            "description": "The % of the test tolerance. A Special attribute to decide, based on configuration if the test will be marked as passed or with warning. Default 0% tolerance. Must be a number with or without the % sign.",
            "priority": 5
        }
    },
    {
        "key": "test-actions",
        "literal": "[test-actions]",
        "verb": "",
        "entity": {
            "name": "test-actions",
            "description": "A collection of atomic pieces of logic which execute a single test case.",
            "priority": 6
        }
    },
    {
        "key": "test-data-provider",
        "literal": "[test-data-provider]",
        "verb": "",
        "entity": {
            "name": "test-data-provider",
            "description": "_*Data*_ created or selected to satisfy the execution preconditions and inputs to execute one or more _*test cases*_.",
            "priority": 7
        }
    },
    {
        "key": "test-expected-results",
        "literal": "[test-expected-results]",
        "verb": "",
        "entity": {
            "name": "test-expected-results",
            "description": "An ideal result that the tester should get after a test action is performed.",
            "priority": 8
        }
    },
    {
        "key": "test-parameters",
        "literal": "[test-parameters]",
        "verb": "",
        "entity": {
            "name": "test-parameters",
            "description": "A list of parameters the user can provide and are exposed by the plugin.",
            "priority": 9
        }
    },
    {
        "key": "test-examples",
        "literal": "[test-examples]",
        "verb": "",
        "entity": {
            "name": "test-examples",
            "description": "Mandatory! One or more examples of how to implement the Plugin in a test.",
            "priority": 10
        }
    },
    {
        "key": "test-models",
        "literal": "[test-models]",
        "verb": "",
        "entity": {
            "name": "test-models",
            "description": "A collection of elements and static data mapping which can be accessed by a reference for optimal reuse.",
            "priority": 11
        }
    }
];