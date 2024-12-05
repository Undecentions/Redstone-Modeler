# [Redstone-Modeler](https://undecentions.github.io/Redstone-Modeler)

![gif](logo_repeat.gif)

Modeler for redstone. Replacement for the old RS Editor. AKA "RSM."

## Why not RS Editor?
[RS Editor](https://github.com/11-90-an/rseditor) has been *the* tool for sending redstone diagrams in chat, usually Discord. However, it has been lacking a large number of features, which RSM attempts to fix.

## Wow, RSM&hellip;
RSM seems to be such a common abbreviation, but no matter if it's the mod, the person, math, or whatever, we have another one.

## Features
- 3D. Yes. It's here. No, not perspective 3D. just 3D.
- Isometric textures. Gives a semi-3D feel, useful for flat textures such as redstone dust and 3D-ness
- One click copy. No more screenshotting, just press the button.
- UI. Smaller selection, individual scrolling. Nice for mobile, where RS Editor's selection would span more than the screen width, and scrolling back and forth is required.
- Hotbar. No endless scrolling through the selection. Slot number may change.
- Block states. Click on an existing block with itself to get to the next state. Instead of each texture individually appearing in the selection, there are block states. No need for 192 redstone dust in the selection to do all the states (note: not all dust textures have been added).
- 2D block states. Select the state with a temporary panel, then put it down, instead of clicking 5 times each on some pistons. The second dimension is used for blocks like redstone dust, where clicking hundreds of times is impractical. Instead, there are 2 selection bars for each signal strength and shape, 30 * 16.
- Preview on hover. Detail, but useful when working in 3D models. Note that the hover does not update on scroll, although not important.
- Drag. No more spam clicking while moving the mouse around. On mobile, scroll with 2 fingers. Note that because of the number of events sent, if you drag too fast, some blocks might be missed. Likely, the best solution is to draw lines between points, but that is not a priority.
- Saving. Uses LZMA ([LZMA-JS](https://github.com/LZMA-JS/LZMA-JS)) so that the code is not hundreds of thousands of characters long. This feature was present in RS Editor, but it was on URL, and in my opinion this is better, and since this is 3D there must be compression. Note that a change to the saving mechanism is planned.

## How am I supposed to use this???
With all those features, RSM may get confusing fairly quickly.

First, you have the selection. Press something in the selection (bottom), and then the hotbar (second bar from bottom), and it'll set that slot.

Have that hotbar slot selected (selector slot also works&mdash;more frequent stuff go in the hotbar though), and you can click on the model to place the block. Click again (for some blocks), and it'll go to the next texture.

Through the 2D selection panel, select a block state (hide the panel by pressing on the hotbar item again). Press the layer buttons to toggle through them.

Finally, press the copy or save button when you're finished. 

## To do
- Change the texture rendering slant angle to make it look clearer.
- More versatile saving.
- Keybinds.
- Logo duration tweak, likely to shorten it.
- Model automatically resizes when you reach an edge.
- Settings and other panels: edit model size, keybinds, and other stuff.
- Tweaking top bar to make it shorter (more mobile friendly), perhaps with icons.

## Any bugs or suggestions?
Either go on the [project Discord](https://discord.gg/2Qndd5v6JF) (for minor problems) or open an issue on this GitHub page. Code readability and structure suggestions are welcome, but don't do minor style stuff such as double vs single quotes.

## RS Editor
Thanks to RS Editor for the inspiration of this project. Code was consulted, but I decided that it was not very usable since this one had completely different logic, and p5.js is unneccesary. The old project can be found at the [RS Editor github page](https://github.com/11-90-an/rseditor).
