from ModelParser import ModelParser
from ModelElement import ModelElement

import numpy as np
import numpy.typing as npt
import copy

from math import floor
from PIL import Image
from typing import Optional, Sequence

from dataclasses import dataclass

from line_profiler import profile

# This file frequently references Minecraft's inverted textures.
# Those are referencing the fact that Minecraft has north as z-
# and west is x+, which is relatively inverted to this renderer.
# This is since the renderer keeps coordinates relatively normal,
# while Minecraft has, for example, the top face texture flipped
# around since north is back and south is forwards.
# The easiest way around this is to simply rotate the model element
# around its center by 180 degrees.


class Renderer:
    """
    The renderer, converts from a model to an image.
    Has an `output` :class:`Image.Image` that it renders
    to, since a block may consist of multiple models.
    """

    output: Image.Image
    depth_buffer: npt.NDArray[np.float32]  # indexing not reversed ([x][y] not [y][x])

    directions = [
        "east",
        "west",
        "down",
        "up",
        "north",
        "south",
    ]
    size = (72, 96)

    def __init__(self):
        self.output = Image.new("RGBA", Renderer.size)
        self.depth_buffer = np.full(
            Renderer.size, -1, dtype=np.float32
        )  # as long as it's < 0

    def get_image(self) -> Image.Image:
        """
        Gets the image. The output image is overlayed on each
        render, for blocks with multiple models.

        Returns
        -------
        Image.Image
            The output image.
        """
        return self.output

    def render(
        self,
        model: ModelParser,
        *,
        x=0,
        y=0,
        z=0,
        color: Optional[tuple[int, int, int, int]] = None,
        uv_lock = False
    ) -> None:
        """
        Renders a model from a :class:`~.ModelParser`, first
        building faces, then rotating, and finally rendering.

        Parameters
        ----------
        model
            A :class:`~.ModelParser` to be rendered. From block state file.
        x
            Angle of rotation around the x axis, clockwise. From block state file.
        y
            Angle of rotation around the y axis, counter-clockwise. From block state file.
        z
            Angle of rotation around the z axis, clockwise. From block state file.
        color
            An optional tuple of (r, g, b, a) specifying the block color (colormap).
        uv_lock
            If true, compute uvs from the rotated textures
            instead of pre-rotated ones. From block state file.
        """
        model.elements = model.get_elements(model)
        element_faces = [self.build_faces(element) for element in model.elements]
        uv_locked_faces = element_faces if uv_lock else copy.deepcopy(element_faces)
        for element, faces in zip(model.elements, element_faces):
            self.rotate_element(element, faces)
            self.rotate_element_center(faces, "x", x)
            self.rotate_element_center(faces, "y", y)
            self.rotate_element_center(faces, "z", z)
        self.rasterize(model.elements, element_faces, uv_locked_faces, color)

    def build_faces(self, element: ModelElement) -> npt.NDArray[np.float32]:
        """
        Build the faces of the element from the `from` and `to` in the model.
        `from` and `to` define the 2 opposite corners of a cuboid of the element.

        Parameters
        ----------
        element
            A :class:`~.ModelElement` to build faces of.

        Returns
        -------
        :class:`numpy.ndarray`
            An array of faces of the element. Shape [6, 4, 3].
        """
        start, end = np.array(element.start), np.array(element.end)

        # 6 faces of the region
        # Orientation is NOT accurate to in-game, this is just what *works*,
        # and what renders *correcty* in *RSM*, but the X Y Z do *not* correspond
        # to the real in-game coordinate system (and for that matter, neither do
        # they correspond to the system in most 3D game engines)
        # They do, however, keep clockwise for front facing since back-face
        # culling is done.
        # (See comment at top about inverted coordinates)

        faces = np.array(
            [
                [[1, 1, 1], [1, 0, 1], [1, 0, 0], [1, 1, 0]],  # x1 == east
                [[0, 1, 0], [0, 0, 0], [0, 0, 1], [0, 1, 1]],  # x2 == west
                [[0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]],  # y1 == down
                [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]],  # y2 == up
                [[1, 1, 0], [1, 0, 0], [0, 0, 0], [0, 1, 0]],  # z1 == north
                [[0, 1, 1], [0, 0, 1], [1, 0, 1], [1, 1, 1]],  # z2 == south
            ],
            dtype=np.float32,
        )

        start_mask = np.repeat([start], 24, axis=0).reshape(faces.shape)
        end_mask = np.repeat([end], 24, axis=0).reshape(faces.shape)

        s0, s1 = faces == 0, faces == 1

        faces[s0] = start_mask[s0]
        faces[s1] = end_mask[s1]

        return faces

    def rotate_faces(
        self,
        faces: npt.NDArray[np.float32],
        origin: Sequence[int | float],
        axis: str,
        angle: float,
        rescale: bool = False,
    ) -> None:
        """
        Rotate faces around axis in place.

        Parameters
        ----------
        faces
            Faces to rotate.
        origin
            Origin of rotation.
        axis
            Axis of rotation. x, y, or z.
        rescale
            Whether to multiply by square root 2 at the end
            (it's assumed that the angle is 45 degrees).
        """
        angle_rad = np.deg2rad(angle)
        indicies = [0, 1, 2]
        indicies.remove("xyz".index(axis))
        a1, a2 = indicies
        o1, o2 = origin[a1], origin[a2]
        sin, cos = np.sin(angle_rad), np.cos(angle_rad)
        sines = [0, 1, 0, -1]
        cosines = [1, 0, -1, 0]
        if angle % 90 == 0:
            sin, cos = sines[int(angle / 90)], cosines[int(angle / 90)]
        for face in faces:
            for point in face:
                x, y = point[a1] - o1, point[a2] - o2
                if rescale:
                    x *= 1 / max(sin, cos)
                    y *= 1 / max(sin, cos)
                point[a1] = x * cos - y * sin + o1
                point[a2] = x * sin + y * cos + o2

    def rotate_element(
        self, element: ModelElement, faces: npt.NDArray[np.float32]
    ) -> None:
        """
        Rotates elements im place based on their `"rotation"` property.

        Parameters
        ----------
        element
            A :class:`~.ModelElement` containing the rotation data.
        faces
            The faces of the element to be rotated.

        Returns
        -------
        None
        """
        rotation = element.rotation
        if rotation is not None:
            # Blind unpacking from dict from JSON
            # hopefully won't break anytime soon
            self.rotate_faces(faces, **rotation)

    def rotate_element_center(
        self, faces: npt.NDArray[np.float32], axis: str, angle: float
    ):
        """
        Rotates elements in place around their center.

        Parameters
        ----------
        faces
            An array of faces of the element.
        axis
            The axis of rotation, one of x, y, z.
        angle
            The angle of rotation, in degrees.
        """
        if angle != 0:
            CENTER = [8, 8, 8]
            self.rotate_faces(faces, CENTER, axis, angle)

    @profile
    def rasterize(
        self,
        elements: list[ModelElement],
        element_faces: list[npt.NDArray[np.float32]],
        uv_locked_faces: list[npt.NDArray[np.float32]],
        color: Optional[tuple[int, int, int, int]] = None,
    ) -> None:
        """
        Renders the texture to :attr:`output`.

        Parameters
        ----------
        elements
            List of elements to render.
        element_faces
            List of faces of each element, generated with :meth:`~.d_faces`.
        uv_locked_faces
            Faces respecting uvlock, where the faces are not rotated if uv lock is on.
        color
            A optional rgba tuple specifying the color (colormap).

        Returns
        -------
        None

        Raises
        ------
        :exc:`ValueError`
            If uv was not present and rotation is not a multiple of 90 degrees,
            since inferring uvs (or uvlock) only works with a face parallel to
            one of the planes.
            Or if the texture uv rotation is not a multiple of 90.
        """
        # Comments marked below to show locations.
        # How RSM Renderer works:
        # 1. Pre-process each face so this thing runs faster
        #   For each face:
        #   a. Use the face name to get its 3D model, / 16
        #   b. Turn the 3D model into a 2D one for the image
        #     Use a matrix multiplication (just looks cleaner) to do math,
        #     where x -> x, y -> y, z -> -1/2y (z goes downwards vertically).
        #     Then, invert y-axis (images have +z going down), and multiply by
        #     image size to convert to pixel coordinates.
        #   c. Backface culling
        #     The shoelace formula without abs or dividing by 2 can be used
        #     to check the direction by its sign.
        #   d. Get UV and missing UV handling (the default parameter in `dict.get`)
        #     Usually unnecessary, but occasionally Minecraft assets have
        #     a missing UV for uv locking, so the UV is calculated from
        #     the model location as if the texture was projected onto the block.
        #   e. Fetch some other properties
        #   f. Get texture; if new, add to cache
        #   g. Get slopes and intercepts
        #     The renderer relies on math with slopes and intercetps to function,
        #     which might not be a very good algorithm, but works fine for now,
        #     although suggestions are definitely welcome.
        #     It works by comparing the intercept of a line through the target point
        #     with the intercepts of the lines of the opposite 2 faces, determining
        #     the position of the point on the face.
        #     Vertical lines just use x-intercept instead of y-intercept.
        #   At the end, store the data
        # 2. Draw each pixel
        #   Loop through each pixel
        #   In each pixel, loop through the stored data
        #   For each model element in the data, loop through its faces
        #   a. Calculate intercepts, see 1g.
        #   b. Check depth buffer to see if pixel is the closest.
        #   c. Check if texture is mirrored. If it is, then the `floor`
        #      operation on the texture pixel coordinates will misalign
        #      the texture since it's going the reverse way. To fix that,
        #      a very small amount must be subtracted from the coordinates.
        #   d. Get coordinates
        #   e. Draw pixel. If the alpha channel is 255, set depth buffer.

        # Just to make things easier to deal with
        @dataclass
        class ProcessedFace:
            face_name: str
            uv: list[int]
            texture: str
            face_3D: npt.NDArray[np.float32]
            slopes: tuple[float, float]
            intercepts: tuple[float, float, float, float]
            rotation: float
            color: bool

        def interpolate(a: int | float, b: int | float, /, alpha: float) -> float:
            """
            Linear interpolation between 2 values.

            Parameters
            ----------
            a
                First value.
            b
                Second value.
            alpha
                Float within [0, 1] specifying the interpolation.

            Returns
            -------
            float
                The interpolated value
            """
            return a + (b - a) * alpha

        TEXTURE_SIZE = 16  # if one day Mojang changes this I'm going crazy

        texture_cache: dict[str, Image.Image] = {}
        faces_processed: list[list[ProcessedFace]] = []

        for element in elements:
            element.do_textures()

        for element, faces, uv_locked in zip(elements, element_faces, uv_locked_faces):
            part = []
            for face_name_ in element.faces.keys():
                # Lots of underscores since name conflicts
                # with things in the next section

                # 1a:
                i_ = Renderer.directions.index(face_name_)
                face_3D_: npt.NDArray[np.float32] = faces[i_] / TEXTURE_SIZE

                # 1b:
                face_ = face_3D_ @ np.array([[1, 0], [0, 1], [0, -0.5]])
                face_[:, 1] = 1 - face_[:, 1]
                face_ *= (Renderer.size[0], Renderer.size[1] * 2 / 3)

                # 1c: backface culling (shoelace formula without abs or halving)
                array_range = np.arange(len(face_))
                if (
                    np.dot(face_[:, 0], face_[array_range - 1, 1])
                    - np.dot(face_[:, 1], face_[array_range - 1, 0])
                    <= 0
                ):
                    continue

                # 1d:
                # Order is x: z -y; y: x z, z: x, -y
                raw_faces = element.faces[face_name_]
                if "uv" in raw_faces:
                    uv_: list[int] = raw_faces["uv"]
                else:
                    uv_locked_face = uv_locked[i_]

                    # Note that after the y-flip, all top left corners are at the
                    # lowest of their coordinates.
                    uv_locked_face[:, 1] = TEXTURE_SIZE - uv_locked_face[:, 1]
                    min_index = np.where(np.all(uv_locked_face == np.min(uv_locked_face, axis=0), axis=1))[0]
                    uv_locked_face = np.roll(uv_locked_face, -min_index, axis=0)
                    face_3D_ = np.roll(face_3D_, -min_index, axis=0)
                    face_ = np.roll(face_, -min_index, axis=0)

                    if np.all(uv_locked_face[:, 0] == uv_locked_face[0, 0]):
                        axis = "x"
                    elif np.all(uv_locked_face[:, 1] == uv_locked_face[0, 1]):
                        axis = "y"
                    elif np.all(uv_locked_face[:, 2] == uv_locked_face[0, 2]):
                        axis = "z"
                    else:
                        raise ValueError("`uvlock` true but rotation not a multiple of 90 degrees.")

                    indicies = [0, 1, 2]
                    indicies.remove("xyz".index(axis))
                    if axis == "x":
                        indicies.reverse()
                    uv_ = [
                        uv_locked_face[0, indicies[0]],
                        uv_locked_face[0, indicies[1]],
                        uv_locked_face[2, indicies[0]],
                        uv_locked_face[2, indicies[1]],
                    ]

                # 1e:
                # Pretty sure the tintindex value specifies how much to tint
                # but that's ignored for now since assets only use 0 or 1 and
                # 1 is only used for the flower_bed stuff which is only used
                # by the pink petal models so it's safe to say that this suffices.
                color_: bool = "tintindex" in element.faces[face_name_]
                rotation_: int = element.faces[face_name_].get("rotation", 0)

                # 1f:
                texture_: str = element.faces[Renderer.directions[i_]]["texture"]
                if ":" not in texture_:
                    namespace, branch = "minecraft", texture_
                else:
                    namespace, branch = texture_.split(":")
                texture_path = f"""assets_renderer/mcassets/{namespace}/textures/{branch}.png"""
                if texture_ not in texture_cache:
                    with Image.open(texture_path) as image:
                        texture_cache[texture_] = image.convert("RGBA")

                # 1g:

                # Naming:
                if face_[0, 0] != face_[1, 0]:
                    slope_x_ = (face_[0, 1] - face_[1, 1]) / (face_[0, 0] - face_[1, 0])
                    p1_x_intercept_ = face_[1, 1] - slope_x_ * face_[1, 0]
                    p2_x_intercept_ = face_[2, 1] - slope_x_ * face_[2, 0]
                else:
                    slope_x_ = None
                    p1_x_intercept_ = face_[1, 0]
                    p2_x_intercept_ = face_[2, 0]

                if face_[1, 0] != face_[2, 0]:
                    slope_y_ = (face_[1, 1] - face_[2, 1]) / (face_[1, 0] - face_[2, 0])
                    p1_y_intercept_ = face_[0, 1] - slope_y_ * face_[0, 0]
                    p2_y_intercept_ = face_[1, 1] - slope_y_ * face_[1, 0]
                else:
                    slope_y_ = None
                    p1_y_intercept_ = face_[0, 0]
                    p2_y_intercept_ = face_[1, 0]

                # Face has 0 width or height, skip
                if p1_x_intercept_ == p2_x_intercept_ or p1_y_intercept_ == p2_y_intercept_:
                    continue

                part.append(
                    ProcessedFace(
                        face_name_,
                        uv_,
                        texture_,
                        face_3D_,
                        (slope_x_, slope_y_),
                        (p1_x_intercept_, p1_y_intercept_, p2_x_intercept_, p2_y_intercept_),
                        rotation_,
                        color_,
                    )
                )
            faces_processed.append(part)

        # x and y are horizontal and vertical
        # As a result, indexing is [y][x] since it goes [vertical][horizontal]
        for x in range(Renderer.size[0]):
            for y in range(Renderer.size[1]):
                for element_processed in faces_processed:
                    for face_processed in element_processed:
                        slope_x, slope_y = face_processed.slopes
                        p1_x_intercept, p1_y_intercept, p2_x_intercept, p2_y_intercept = face_processed.intercepts
                        x_middle, y_middle = x + 0.5001, y + 0.5001

                        # 2a:
                        # Possibility of divide by 0 checked above
                        x_intercept = y_middle - slope_x * (x_middle) if slope_x is not None else x_middle
                        texture_x = (x_intercept - p1_x_intercept) / (p2_x_intercept - p1_x_intercept)
                        if not 0 <= texture_x < 1:
                            continue

                        y_intercept = y_middle - slope_y * (x_middle) if slope_y is not None else x_middle
                        texture_y = (y_intercept - p1_y_intercept) / (p2_y_intercept - p1_y_intercept)
                        if not 0 <= texture_y < 1:
                            continue

                        face_3D: npt.NDArray[np.float32] = face_processed.face_3D

                        # 2b:
                        z1 = interpolate(face_3D[0, 2], face_3D[1, 2], texture_y)
                        z2 = interpolate(face_3D[3, 2], face_3D[2, 2], texture_y)
                        z = interpolate(z1, z2, texture_x)

                        if z <= self.depth_buffer[x, y]:
                            continue

                        image = texture_cache[face_processed.texture]

                        # 2c:
                        x_inv = p1_x_intercept > p2_x_intercept
                        y_inv = p1_y_intercept > p2_y_intercept

                        # Searching textures shows rotation can only be
                        # 0, 90, 180, or 270 (rarely 0)
                        match face_processed.rotation:
                            case 0:
                                pass
                            case 90:
                                texture_x, texture_y = texture_y, 1 - texture_x
                                y_inv = not y_inv
                            case 180:
                                texture_x, texture_y = 1 - texture_x, 1 - texture_y
                                x_inv = not x_inv
                                y_inv = not y_inv
                            case 270:
                                texture_x, texture_y = 1 - texture_y, texture_x
                                x_inv = not x_inv
                            case other:
                                raise ValueError(
                                    f"Texture rotation {other} not in 0, 90, 180, 270."
                                )

                        # 2d:
                        u, v, s, t = face_processed.uv

                        texture_x_pixels = min(
                            floor(interpolate(u, s, texture_x) / TEXTURE_SIZE * image.width),
                            image.width - 1,
                        )

                        # For animated textures, only get first frame
                        # For liquid textures, cut in half (not implemented)
                        texture_y_pixels = min(
                            floor(interpolate(v, t, texture_y) / TEXTURE_SIZE * image.width),
                            image.width - 1,
                        )

                        # 2e:
                        pixel = image.getpixel((texture_x_pixels, texture_y_pixels))
                        if isinstance(pixel, tuple) and pixel[3] != 0:
                            if pixel[3] == 255:
                                # No depth buffer writing if translucent pixel
                                self.depth_buffer[x, y] = z

                            if face_processed.color and color is not None:
                                pixel = (
                                    int(pixel[0] * color[0] / 255),
                                    int(pixel[1] * color[1] / 255),
                                    int(pixel[2] * color[2] / 255),
                                    int(pixel[3] * color[3] / 255),
                                )
                            self.output.putpixel((x, y), pixel)

                        # Useful debugging things
                        # self.output.putpixel((x, y), (texture_x_pixels * 255 // 16, texture_y_pixels * 255 // 16, 0, 255))
                        # self.output.putpixel((x, y), (int(texture_x * 255), int(texture_y * 255), 0, 255))
