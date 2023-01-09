
import { isJobStatusSuccess } from './util';


/**
 * Check given input and run a save process for the specified package manager
 * @returns Promise that will be resolved when the save process finishes
 */
async function saveCache() {
    const jobStatus = isJobStatusSuccess();
    const cache = core.getInput(constants.INPUT_CACHE);
    return jobStatus && cache ? save(cache) : Promise.resolve();
  }
  