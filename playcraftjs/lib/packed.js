/**
 * Special include file added to the playcraft library when it's been built and packed. This file is not included
 * when the developer loader is used to run the game.
 */

if (!window.pc)
    window.pc = {};

pc.packed = true;
