import { Command } from "commander";
import chalk from "chalk";

import Driver from "./driver/mocha";
import { MetaConfiguration, SubmitConfiguration } from "./types";
import excercises from "./excercises";

const handleRunComplete = (errors) => {
    if (errors) {
        console.log(errors);
    }
};

const validateSolution = async (
    handle: string,
    configuration: SubmitConfiguration
) => {
    const driver = new Driver({
        reporter: "spec",
    });
    /* Since `require` is invoked from `./driver`, we need to force prepend `..`
     * to the excercise file path.
     */
    driver.resolveFile = (file) => `../excercises/${file}`;

    const index = excercises.indexOf(handle);
    if (index < 0) {
        console.log("error: Cannot find excercise");
        return;
    }

    driver.addFile(excercises[index]);
    driver.run(handleRunComplete);
};

const generateMeta = async (configuration: MetaConfiguration) => {
    const driver = new Driver({
        dryRun: true,
        reporter: "json_all",
        reporterOption: {
            output: configuration.file || undefined,
        },
    });
    /* Since `require` is invoked from `./driver`, we need to force prepend `..`
     * to the excercise file path.
     */
    driver.resolveFile = (file) => `../${file}`;
    driver.addFiles(
        ...excercises.map((excerciseFile) => `./excercises/${excerciseFile}`)
    );
    driver.run(handleRunComplete);
    console.log("Done");
};

const configureCommands = (): Command => {
    const program = new Command();
    program.version("0.1.0");

    const submitCommand = new Command();
    submitCommand
        .name("submit")
        .argument("<handle>", "the handle for the exercise")
        .option(
            "--print-error",
            "print the standard error generated by the solution",
            true
        )
        .option(
            "--print-output",
            "print the standard output generated by the solution",
            true
        )
        .alias("x")
        .description("validate your solution and submit the results")
        .action(async (handle: string) => {
            const configuration = {
                ...program.opts(),
                ...submitCommand.opts(),
            } as SubmitConfiguration;
            await validateSolution(handle, configuration);
        });
    program.addCommand(submitCommand);

    const metaCommand = new Command();
    metaCommand
        .name("meta")
        .argument(
            "[file]",
            "the resulting output file (default: standard output stream)",
            null
        )
        .alias("m")
        .description("extract excercise metadata as JSON")
        .action(async (file: string | null) => {
            const configuration = {
                file,
                ...program.opts(),
                ...metaCommand.opts(),
            } as MetaConfiguration;
            await generateMeta(configuration);
        });
    program.addCommand(metaCommand);

    program.option(
        "-f, --exercise-file <file>",
        "specify the exercise file",
        "rover.json"
    );

    return program;
};

const packageData = require("../../package");

const main = () => {
    console.log(
        chalk.bold(
            `rover ${packageData.version} ${chalk.greenBright(
                "(https://academyjs.com/rover)"
            )}`
        )
    );
    const program = configureCommands();
    program.parse(process.argv);
};

export { main };

// execute("node", ["./hello.js"], {
//     standardOutputEncoding: "utf8",
//     standardOutputLimit: 65 * 1024,
//     standardErrorEncoding: "utf8",
//     standardErrorLimit: 65 * 1024,
//     timeout: 1000 * 3,
// })
//     .then((result) => console.log(result))
//     .catch(console.log);
