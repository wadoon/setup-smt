
export function getTempDir() {
    let tempDirectory = process.env['RUNNER_TEMP'] || os.tmpdir();

    return tempDirectory;
}

export function getBooleanInput(inputName: string, defaultValue: boolean = false) {
    return (core.getInput(inputName) || String(defaultValue)).toUpperCase() === 'TRUE';
}


export function isJobStatusSuccess() {
    const jobStatus = core.getInput(INPUT_JOB_STATUS);

    return jobStatus === 'success';
}
