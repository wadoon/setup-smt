import { Octokit } from "@octokit/action";
import { warning, error, debug } from "@actions/core"
import { join } from 'path';
import os from 'os';
import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as glob from '@actions/glob';

async function run() {
    try {
        const versions = core.getMultilineInput("smt-solvers");
        const installationFolder = core.getInput("install");

        installKeySMTmanager();

        
        core.startGroup('Installing SMT-solvers');
        
        if (!versions.length) {
            core.debug('java-version input is empty, looking for java-version-file input');
            const content = fs
                .readFileSync(versionFile)
                .toString()
                .trim();

            const version = getVersionFromFileContent(content, distributionName);
            core.debug(`Parsed version from file '${version}'`);

            if (!version) {
                throw new Error(`No supported version was found in file ${versionFile}`);
            }

            await installVersion(version, installerInputsOptions);
        }

        for (const [index, version] of versions.entries()) {
            await installVersion(version, installerInputsOptions, index);
        }
        core.endGroup();

        const matchersPath = path.join(__dirname, '..', '..', '.github');
        core.info(`##[add-matcher]${path.join(matchersPath, 'java.json')}`);

        if (cache && isCacheFeatureAvailable()) {
            await restore(cache);
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
