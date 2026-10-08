import snapshot from "../../public/release-cache.json";
import { createReleaseData } from "./release-data.mjs";

export const currentRelease = createReleaseData(snapshot);
export const release = currentRelease.release;
export const releaseTag = currentRelease.tag;
export const releaseVersion = currentRelease.version;
export const releaseDocURL = currentRelease.docURL;
