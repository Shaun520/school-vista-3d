"""Probe a legacy .skp file: import with skppy, report stats, render preview.

Usage:
  blender --background --factory-startup --python tools/asset-pipeline/probe_skp.py -- <input.skp> <out_dir>
"""

import json
import math
import os
import sys
import time

import bpy
from mathutils import Vector


def arg_value(flag_index):
    argv = sys.argv
    if len(argv) > flag_index:
        return argv[flag_index]
    return None


skp_path = arg_value(sys.argv.index("--") + 1) if "--" in sys.argv else None
out_dir = arg_value(sys.argv.index("--") + 2) if "--" in sys.argv else None
if not skp_path or not out_dir:
    raise SystemExit("usage: probe_skp.py -- <input.skp> <out_dir>")

os.makedirs(out_dir, exist_ok=True)

try:
    bpy.ops.preferences.addon_enable(module="blender_skp_io")
    print("ADDON_ENABLE=OK")
except Exception as exc:  # noqa: BLE001
    print("ADDON_ENABLE=FAIL", repr(exc))
    raise SystemExit(1)

print("ADDON_REGISTERED=", "blender_skp_io" in bpy.context.preferences.addons)

for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

t0 = time.time()
bpy.ops.import_scene.skp(filepath=skp_path)
print("IMPORT=OK", round(time.time() - t0, 1), "s")

objs = list(bpy.data.objects)
meshes = [o for o in objs if o.type == "MESH"]
hidden_objs = [o.name for o in objs if o.hide_render or o.hide_viewport]
hidden_colls = [c.name for c in bpy.data.collections if c.hide_render or c.hide_viewport]
print("HIDDEN_OBJS=" + json.dumps({"count": len(hidden_objs), "sample": hidden_objs[:30]}, ensure_ascii=False))
print("HIDDEN_COLLECTIONS=" + json.dumps(hidden_colls, ensure_ascii=False))
print("COLLECTIONS=" + json.dumps([c.name for c in bpy.data.collections], ensure_ascii=False))
total_tris = 0
total_verts = 0
for o in meshes:
    me = o.data
    total_verts += len(me.vertices)
    try:
        me.calc_loop_triangles()
        total_tris += len(me.loop_triangles)
    except Exception:  # noqa: BLE001
        pass

mn = Vector((1e18, 1e18, 1e18))
mx = Vector((-1e18, -1e18, -1e18))
for o in meshes:
    for corner in o.bound_box:
        p = o.matrix_world @ Vector(corner)
        mn.x = min(mn.x, p.x)
        mn.y = min(mn.y, p.y)
        mn.z = min(mn.z, p.z)
        mx.x = max(mx.x, p.x)
        mx.y = max(mx.y, p.y)
        mx.z = max(mx.z, p.z)

size = mx - mn

# robust framing: drop stray construction geometry (lines far outside the campus)
xs, ys = [], []
for o in meshes:
    if len(o.data.vertices) > 20000:
        continue
    mw = o.matrix_world
    for v in o.data.vertices:
        p = mw @ v.co
        xs.append(p.x)
        ys.append(p.y)


def pct(values, q):
    ordered = sorted(values)
    if not ordered:
        return 0.0
    return ordered[min(len(ordered) - 1, max(0, int(len(ordered) * q)))]


frame_min = Vector((pct(xs, 0.02), pct(ys, 0.02), mn.z))
frame_max = Vector((pct(xs, 0.98), pct(ys, 0.98), mx.z))
frame_size = frame_max - frame_min
stats = {
    "skp": skp_path,
    "objects": len(objs),
    "mesh_objects": len(meshes),
    "empties": len([o for o in objs if o.type == "EMPTY"]),
    "verts": total_verts,
    "tris": total_tris,
    "materials": len(bpy.data.materials),
    "images": len(bpy.data.images),
    "bbox_min": [round(v, 3) for v in mn],
    "bbox_max": [round(v, 3) for v in mx],
    "size": [round(v, 3) for v in size],
    "frame_size": [round(v, 2) for v in frame_size],
    "hidden_objects": len(hidden_objs),
}
print("STATS=" + json.dumps(stats, ensure_ascii=False))
print("TOPNAMES=" + json.dumps(sorted(o.name for o in objs)[:100], ensure_ascii=False))
print("MATERIALS=" + json.dumps(sorted(m.name for m in bpy.data.materials), ensure_ascii=False))
print("LARGEST=" + json.dumps(
    sorted(([len(o.data.vertices), o.name] for o in meshes), reverse=True)[:25],
    ensure_ascii=False,
))

dims = []
for o in meshes:
    corners = [o.matrix_world @ Vector(c) for c in o.bound_box]
    dx = max(p.x for p in corners) - min(p.x for p in corners)
    dy = max(p.y for p in corners) - min(p.y for p in corners)
    dz = max(p.z for p in corners) - min(p.z for p in corners)
    dims.append([round(max(dx, dy, dz), 2), round(dx, 2), round(dy, 2), round(dz, 2), o.name])
print("BIGGEST_DIMS=" + json.dumps(sorted(dims, reverse=True)[:15], ensure_ascii=False))
print("IMAGES=" + json.dumps([
    {"name": img.name, "size": list(img.size), "packed": img.packed_file is not None}
    for img in bpy.data.images
], ensure_ascii=False))

with open(os.path.join(out_dir, "import_stats.json"), "w", encoding="utf-8") as fh:
    json.dump(stats, fh, ensure_ascii=False, indent=2)

scene = bpy.context.scene
frame_center = (frame_min + frame_max) * 0.5
frame_diag = max(frame_size.length, 1.0)

# reveal hidden SketchUp layers / objects so the preview shows the whole model
for coll in bpy.data.collections:
    coll.hide_render = False
    coll.hide_viewport = False


def reveal(layer_coll):
    layer_coll.exclude = False
    layer_coll.hide_viewport = False
    for child in layer_coll.children:
        reveal(child)


reveal(bpy.context.view_layer.layer_collection)
for obj in objs:
    obj.hide_render = False
    obj.hide_viewport = False
    try:
        obj.hide_set(False)
    except RuntimeError:
        pass

cam_data = bpy.data.cameras.new("probe_cam")
cam_data.clip_start = 0.05
cam_data.clip_end = 100000.0
cam = bpy.data.objects.new("probe_cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light = "STUDIO"
scene.display.shading.color_type = "TEXTURE"
scene.display.shading.show_shadows = True
scene.display.shading.show_cavity = True
scene.render.resolution_x = 1600
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100

# top-down orthographic view of the whole scene
cam_data.type = "ORTHO"
cam_data.ortho_scale = max(size.x, size.y) * 1.02
full_center = (mn + mx) * 0.5
full_diag = max(size.length, 1.0)
cam.location = full_center + Vector((0, 0, full_diag * 2))
cam.rotation_euler = (full_center - cam.location).to_track_quat("-Z", "Y").to_euler()
scene.render.filepath = os.path.join(out_dir, "preview_top.png")
bpy.ops.render.render(write_still=True)

# aerial perspective view with Cycles so materials/textures read correctly
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 24
scene.cycles.use_denoising = True
if scene.world is None:
    scene.world = bpy.data.worlds.new("probe_world")
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0.55, 0.7, 0.9, 1.0)
    bg.inputs[1].default_value = 1.0

sun_data = bpy.data.lights.new("probe_sun", "SUN")
sun_data.energy = 3.0
sun = bpy.data.objects.new("probe_sun", sun_data)
scene.collection.objects.link(sun)
sun.rotation_euler = (math.radians(50), math.radians(-15), math.radians(30))

cam_data.type = "PERSP"
cam_data.lens = 50
cam.location = full_center + Vector((full_diag * 0.55, -full_diag * 0.55, full_diag * 0.5))
cam.rotation_euler = (full_center - cam.location).to_track_quat("-Z", "Y").to_euler()
scene.render.filepath = os.path.join(out_dir, "preview_aerial.png")
bpy.ops.render.render(write_still=True)
print("RENDER=OK")

# material close-up of the largest building
biggest = max(meshes, key=lambda o: max(
    max((o.matrix_world @ Vector(c))[i] for c in o.bound_box)
    - min((o.matrix_world @ Vector(c))[i] for c in o.bound_box)
    for i in (0, 1, 2)
))
bmin = Vector((min((biggest.matrix_world @ Vector(c)).x for c in biggest.bound_box),
               min((biggest.matrix_world @ Vector(c)).y for c in biggest.bound_box),
               min((biggest.matrix_world @ Vector(c)).z for c in biggest.bound_box)))
bmax = Vector((max((biggest.matrix_world @ Vector(c)).x for c in biggest.bound_box),
               max((biggest.matrix_world @ Vector(c)).y for c in biggest.bound_box),
               max((biggest.matrix_world @ Vector(c)).z for c in biggest.bound_box)))
bcenter = (bmin + bmax) * 0.5
bsize = max((bmax - bmin).length, 10.0)

cam_data.lens = 45
cam.location = bcenter + Vector((bsize * 0.7, -bsize * 0.9, bsize * 0.45))
cam.rotation_euler = (bcenter - cam.location).to_track_quat("-Z", "Y").to_euler()
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.filepath = os.path.join(out_dir, "preview_closeup.png")
bpy.ops.render.render(write_still=True)
print("RENDER_CLOSEUP=OK", biggest.name)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out_dir, "imported.blend"))
print("BLEND=OK")

bpy.ops.export_scene.gltf(
    filepath=os.path.join(out_dir, "preview.glb"),
    export_format="GLB",
    use_selection=False,
    export_apply=True,
)
print("GLB=OK")
print("DONE")
