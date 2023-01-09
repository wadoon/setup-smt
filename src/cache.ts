import { Octokit } from "@octokit/action";
import { warning, error, debug } from "@actions/core"
import { join } from 'path';
import os from 'os';
import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as glob from '@actions/glob';

const STATE_CACHE_PRIMARY_KEY = 'cache-primary-key';
const CACHE_MATCHED_KEY = 'cache-matched-key';
const CACHE_KEY_PREFIX = 'setup-java';

/**
 * Restore the dependency cache
 * @param id ID of the package manager, should be "maven" or "gradle"
 */
export async function restore(id: string) {
    const packageManager = findPackageManager(id);
    const primaryKey = await computeCacheKey(packageManager);

    core.debug(`primary key is ${primaryKey}`);
    core.saveState(STATE_CACHE_PRIMARY_KEY, primaryKey);
    if (primaryKey.endsWith('-')) {
        throw new Error(
            `No file in ${process.cwd()} matched to [${packageManager.pattern
            }], make sure you have checked out the target repository`
        );
    }

    // No "restoreKeys" is set, to start with a clear cache after dependency update (see https://github.com/actions/setup-java/issues/269)
    const matchedKey = await cache.restoreCache(packageManager.path, primaryKey);
    if (matchedKey) {
        core.saveState(CACHE_MATCHED_KEY, matchedKey);
        core.setOutput('cache-hit', matchedKey === primaryKey);
        core.info(`Cache restored from key: ${matchedKey}`);
    } else {
        core.setOutput('cache-hit', false);
        core.info(`${packageManager.id} cache is not found`);
    }
}

/**
 * Save the dependency cache
 * @param id ID of the package manager, should be "maven" or "gradle"
 */
export async function save(id: string) {
    const packageManager = findPackageManager(id);
    const matchedKey = core.getState(CACHE_MATCHED_KEY);

    // Inputs are re-evaluated before the post action, so we want the original key used for restore
    const primaryKey = core.getState(STATE_CACHE_PRIMARY_KEY);

    if (!primaryKey) {
        core.warning('Error retrieving key from state.');
        return;
    } else if (matchedKey === primaryKey) {
        // no change in target directories
        core.info(`Cache hit occurred on the primary key ${primaryKey}, not saving cache.`);
        return;
    }
    try {
        await cache.saveCache(packageManager.path, primaryKey);
        core.info(`Cache saved with the key: ${primaryKey}`);
    } catch (error) {
        if (error.name === cache.ReserveCacheError.name) {
            core.info(error.message);
        } else {
            if (isProbablyGradleDaemonProblem(packageManager, error)) {
                core.warning(
                    'Failed to save Gradle cache on Windows. If tar.exe reported "Permission denied", try to run Gradle with `--no-daemon` option. Refer to https://github.com/actions/cache/issues/454 for details.'
                );
            }
            throw error;
        }
    }
}
