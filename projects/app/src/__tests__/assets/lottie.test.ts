import { Animation, MatteMode } from "@lottiefiles/lottie-js";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import test from "node:test";
import { z } from "zod";

void test(`no luminance layers in lottie animations (incompatible with lottie-ios)`, async () => {
  const projectRoot = path.join(import.meta.dirname, `../../..`);
  const assetsPath = path.join(projectRoot, `src/assets`);

  // Find all files in `assetsPath` ending in .lottie.json using glob.
  const lottieJs = new Animation();
  let foundFiles = false;

  for await (const lottieFile of fs.glob(`**/*.lottie.json`, {
    cwd: assetsPath,
  })) {
    foundFiles = true;

    const lottieContents = await fs.readFile(
      path.join(assetsPath, lottieFile),
      `utf8`,
    );
    const anim = lottieJs.fromJSON(
      z.record(z.unknown()).parse(JSON.parse(lottieContents)),
    );

    // Check each layer to make sure it's not a luminance mask.
    anim.layers.forEach((layer) => {
      assert.notEqual(
        layer.matteMode,
        MatteMode.LUMA,
        `luminance layer in ${lottieFile} (id=${layer.id})`,
      );
    });
  }

  assert(foundFiles, `no lottie files found, wrong path set?`);
});
