// touche-manipulateur.js
// Source originale : bundle.js:1 -> e.registerComponent({name:"global-transform"})
// Projet : guide_0.2 (8th Wall / ECS - window.ecs)
// Rôle : manipuler l'entité par gestes tactiles AVANT validation
//  - 1 doigt : déplacer en XZ (drag)
//  - 2 doigts pincer : scale uniforme [0.02 .. 2]
//  - 2 doigts tourner : rotation Yaw
//  - Gestes désactivés après événement "validated", réactivés sur "reset"

(() => {
  "use strict";
  const ecs = window.ecs;

  // Helpers (issus du bundle)
  function setScale(world, eid, scale) {
    if (eid !== null) try { world.transform.setLocalScale(eid, ecs.math.vec3.xyz(scale, scale, scale)); } catch {}
  }
  function setYaw(world, entity, eid, yawDeg) {
    if (entity === null && !eid) return;
    const halfRad = yawDeg * Math.PI / 180 / 2;
    const s = Math.sin(halfRad), c = Math.cos(halfRad);
    // quaternion base -0.707 / 0.707 (rotation X -90°) combiné au yaw Y
    const q = { x: 0 + -0.7071068 * c + 0 * s, y: 0 - -0.7071068 * s + 0 * c, z: 0.7071068 * s, w: 0.7071068 * c };
    const quat = ecs.math.quat.xyzw ? ecs.math.quat.xyzw(q.x, q.y, q.z, q.w) : q;
    try { entity && entity.set(ecs.Quaternion, quat); } catch {}
    try { entity && entity.setQuaternion && entity.setQuaternion(quat); } catch {}
    try { eid !== null && world.transform.setLocalRotation?.(eid, quat); } catch {}
  }

  ecs.registerComponent({
    name: "global-transform",
    stateMachine: ({ world, eid, defineState }) => {
      let validated = false;      // o : gestes bloqués après validation
      let scale = 0.089;          // i : scale actuel (init 0.089 = 40cm)
      let yaw = -29.074;          // r : yaw actuel en degrés
      let isDragging = false;     // c
      let lastPos = null;         // s : {x,y}
      let startDist = null;       // l
      let startScale = scale;     // d
      let startAngle = null;      // u
      let startYaw = yaw;         // m

      const getTouches = (e) => Array.from(e.touches);
      const getDistance = (touches) => {
        if (touches.length < 2) return 0;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
      };
      const getAngle = (touches) => {
        if (touches.length < 2) return 0;
        return 180 * Math.atan2(touches[1].clientY - touches[0].clientY, touches[1].clientX - touches[0].clientX) / Math.PI;
      };

      defineState("init").initial().onEnter(() => {
        // Ecoute validation / reset
        const onValidated = () => { validated = true; console.log("[Global] Validé - gestes désactivés"); };
        world.events.addListener?.(world.events.globalId, "validated", onValidated);
        window.addEventListener("planb:validated", onValidated);
        window.addEventListener("planb:reset", () => {
          validated = false; scale = 0.089; yaw = -29.074;
          console.log("[Global] Reset");
        });

        const target = document.querySelector("canvas") || document.body;

        target.addEventListener("touchstart", (e) => {
          if (validated) return;
          if (e.target.closest("#adjustBar, #coaching, button, #ui-container")) return;
          try { if (ecs.Disabled.has?.(world, eid)) return; } catch {}
          const touches = getTouches(e);
          if (touches.length >= 2) {
            startDist = getDistance(touches);
            startScale = scale;
            startAngle = getAngle(touches);
            startYaw = yaw;
            isDragging = false;
            e.preventDefault();
          } else if (touches.length === 1) {
            isDragging = true;
            lastPos = { x: touches[0].clientX, y: touches[0].clientY };
          }
        }, { passive: false });

        target.addEventListener("touchmove", (e) => {
          if (validated) return;
          if (e.target.closest("#adjustBar, #coaching, button, #ui-container")) return;
          const touches = getTouches(e);

          // 2 doigts : scale + rotation
          if (touches.length >= 2 && startDist !== null && startAngle !== null) {
            isDragging = false;
            const ratio = getDistance(touches) / startDist;
            scale = Math.max(0.02, Math.min(2, startScale * ratio));
            setScale(world, eid, scale);

            const angle = getAngle(touches);
            yaw = startYaw + (angle - startAngle);
            const entity = world.getEntity(eid);
            setYaw(world, entity, eid, yaw);
            e.preventDefault();

          // 1 doigt : translation XZ
          } else if (isDragging && lastPos && touches.length === 1) {
            const cur = touches[0];
            const dx = cur.clientX - lastPos.x;
            const dy = cur.clientY - lastPos.y;
            lastPos = { x: cur.clientX, y: cur.clientY };
            const factor = 0.0005; // 5e-4
            const pos = ecs.math.vec3.zero();
            world.transform.getLocalPosition(eid, pos);
            const nx = Number(pos.x) - dx * factor;
            const nz = Number(pos.z) + dy * factor;
            world.getEntity(eid).setLocalPosition(ecs.math.vec3.xyz(nx, Number(pos.y), nz));
            e.preventDefault();
          }
        }, { passive: false });

        target.addEventListener("touchend", (e) => {
          if (e.touches.length === 0) { isDragging = false; lastPos = null; startDist = null; startAngle = null; }
        });
        target.addEventListener("touchcancel", () => {
          isDragging = false; lastPos = null; startDist = null; startAngle = null;
        });

        // API debug globale
        window.globalTransform = { getScale: () => scale, getYaw: () => yaw };
      });
    }
  });
})();
