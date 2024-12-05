# RSM Renderer
This folder is for RSM Renderer, a subproject of RSM. I considered moving this project to its own repository, however, it's such a specific and ad-hoc project that it has little to no use outside RSM (other than for referene about Minecraft's assets format).

## Why RSM Renderer?
RSM used to rely on Isorender for textures, which wasn't optimal. After a lot of coding and a bunch of bug fixing, I developed a tool to use to mass-render textures for RSM.

## Inner workings
This Renderer is just a simple tool for rendering. It isn't very fast, and isn't aiming to be so. Instead of object based rendering, RSM Renderer uses ray-tracing like rasterization techniques (ray-tracing in that it renders by pixel, but it doesn't do bouncing off surfaces or anything), semi-optimized to render at an acceptable pace. Special textures that aren't in the Minecraft assets (or are represented weirdly) are put in the "custom" folder, while the raw Minecraft assets go in the "minecraft" folder (not included).
Check comments in code for little explanations on how the thing works.
