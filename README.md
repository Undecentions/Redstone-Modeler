# Redstone-Modeler
Modeler for redstone. Replacement for the old rseditor. Abbreviated as "RSM."

## Why not RS Editor?
RS Editor has been *the* tool for sending redstone diagrams in chat, mostly Discord. However, it has been lacking a large number of features, which RSM attempts to fix.

## Wow, RSM, hehehe
Yeah, I know, RSM seems to be such a common abbreviation, but no matter if it's the Multimeter, the person, or whatever, we have another RSM on the list.

## Features
- Isometric textures. Gives a semi-3D feel, useful for flat textures such as redstone dust
- 3D. Yes. The most wanted feature of all. And now it's in RSM.
- One click copy. No more screenshotting endlessly
- UI. Smaller selection panel, individual scrolling. Especially nice for mobile, where RS Editor's selection would span more than the screen width.
- Hotbar. No endless scrolling through the selection.
- Block states. Click on an existing block with itself to get to the next state. Instead of each texture individually appearing in the selection, there are block states. No need for 192 redstone dust in the selection to do all the states (note: not all dust textures have been added, and a change is planned to the block states selection).
- Preview on hover. Minor detail, but really useful when working with 3D models. Note that the hover does not update when the model is scrolled on, make a PR if you can fix it.
- Drag. No more spam clicking while moving the mouse around.

## To do
- Add more blocks. That's the only downside for now, and I just need to do some rendering to fix that. Won't be *that* hard, will it???
- Render and add logo.
- 2D block states. Select the state with a temporary panel, then put it down, instead of clicking 5 times each on some pistons. The second dimension is used for blocks like redstone dust, where clocking 192 times is impossible. Instead, there are 2 selection bars for each signal strength and shape, 12 * 16. (Note that this change would include making the selection a module, which is planned)

## Any bugs or suggestions?
Either go on the project Discord (to be finished, better for more minor issues, open an issue if it's a bug) or open an issue on this github page. Code readability and structure suggestions are welcome, but don't do minor style stuff such as double vs single quotes.

## RS Editor
Thanks to RS Editor for the idea of this project. Some code was consulted, but I decided that it was not very usable, and p5.js is unneccesary. The old project can be found at the [RS Editor github page](https://github.com/11-90-an/rseditor).
