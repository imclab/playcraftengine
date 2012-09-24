

/**
 * Renders all entities that have drawable components
 */
pc.systems.Render = pc.systems.EntitySystem.extend('pc.systems.Render',
    {},
    {
        init: function()
        {
            this._super( [ 'sprite', 'overlay', 'rect', 'text' ] );
        },

        processAll: function()
        {
            var startTime = Date.now();

            var next = this.entities.first;
            while (next)
            {
                var entity = next.obj;
                if (entity.active)
                {
                    var spatial = entity.getComponent('spatial');
                    var alpha = entity.getComponent('alpha');
                    var clip = entity.getComponent('clip');

                    // accommodate scene viewport and layering offset positions
                    var drawX = entity.layer.screenX(spatial.pos.x);
                    var drawY = entity.layer.screenY(spatial.pos.y);

                    // is it onscreen?
                    if (entity.layer.scene.viewPort.overlaps(drawX, drawY, spatial.dim.x, spatial.dim.y,0, spatial.dir))
                    {
                        var ctx = pc.device.ctx;

                        if (clip)
                        {
                            ctx.save();
                            ctx.beginPath();
                            if (clip.entity)
                            {
                                var sp = clip.entity.getComponent('spatial');
                                ctx.rect(
                                    entity.layer.screenX(sp.pos.x) + clip.x, entity.layer.screenY(sp.pos.y) + clip.y,
                                    sp.dim.x+clip.w, sp.dim.y+clip.h);
                            } else
                            {
                                // just plain rectangle clipping
                                ctx.rect(
                                    entity.layer.screenX(spatial.pos.x) + clip.x,
                                    entity.layer.screenY(spatial.pos.y) + clip.y, clip.w, clip.h);
                            }
                            ctx.closePath();
                            ctx.clip();
                        }

                        var shifter = entity.getComponent('originshifter');
                        if (shifter)
                        {
                            // if it has a shifter on it, adjust the position of the entity based on a ratio to
                            // the layer's origin

                            // reverse any changes we've made so far
                            var origX = spatial.pos.x - shifter._offsetX;
                            var origY = spatial.pos.y - shifter._offsetY;

                            shifter._offsetX = (this.layer.origin.x * shifter.ratio);
                            shifter._offsetY = (this.layer.origin.y * shifter.ratio);

                            spatial.pos.x = origX + shifter._offsetX;
                            spatial.pos.y = origY + shifter._offsetY;
                        }

                        var spriteComponent = entity.getComponent('sprite');
                        if (spriteComponent)
                        {
                            spriteComponent.sprite.update(pc.device.elapsed);
                            if (alpha && alpha.level != 1 && alpha.level != 0)
                                spriteComponent.sprite.alpha = alpha.level;
                            spriteComponent.sprite.draw(ctx, drawX+ spriteComponent.offset.x, drawY+ spriteComponent.offset.y, spatial.dir);
                        }

                        var overlay = entity.getComponent('overlay');
                        if (overlay)
                        {
                            // update and draw the overlay sprite
                            overlay.sprite.update(pc.device.elapsed);
                            if (alpha)
                                overlay.sprite.alpha = alpha.level;
                            overlay.sprite.draw(ctx, drawX, drawY, spatial.dir);

                            overlay.decrease(pc.device.elapsed);
                            if (overlay.hasExpired())
                                entity.removeComponent(overlay);
                        }

                        var rect = next.obj.getComponent('rect');
                        if (rect)
                        {
                            ctx.save();
                            ctx.lineWidth = rect.lineWidth;
                            ctx.fillStyle = rect.color.color;
                            if (alpha) ctx.globalAlpha = alpha.level;
                            if (rect.strokeColor && rect.lineWidth) ctx.strokeStyle = rect.strokeColor.color;

                            ctx.translate(drawX+(spatial.dim.x/2), drawY+(spatial.dim.y/2));
                            ctx.rotate( spatial.dir * (Math.PI/180));

                            // rounded rectangle
                            if (rect.cornerRadius > 0)
                            {
                                ctx.beginPath();
                                ctx.moveTo(drawX + spatial.radius, drawY);
                                ctx.lineTo(drawX + spatial.dim.x - spatial.radius, drawY);
                                ctx.quadraticCurveTo(drawX + spatial.dim.x, drawY, drawX + spatial.dim.x, drawY + spatial.radius);
                                ctx.lineTo(drawX + spatial.dim.x, drawY + spatial.dim.y - spatial.radius);
                                ctx.quadraticCurveTo(drawX + spatial.dim.x, drawY + spatial.dim.y,
                                    drawX + spatial.dim.x - spatial.radius, drawY + spatial.dim.y);
                                ctx.lineTo(drawX + spatial.radius, drawY + spatial.dim.y);
                                ctx.quadraticCurveTo(drawX, drawY + spatial.dim.y, drawX, drawY + spatial.dim.y - spatial.radius);
                                ctx.lineTo(drawX, drawY + spatial.radius);
                                ctx.quadraticCurveTo(drawX, drawY, drawX + spatial.radius, drawY);
                                ctx.closePath();
                                ctx.fill();
                            } else
                            {
                                ctx.fillRect(-spatial.dim.x/2, -spatial.dim.y/2, spatial.dim.x, spatial.dim.y);
                                if (rect.strokeColor && rect.lineWidth)
                                    ctx.strokeRect(-spatial.dim.x/2, -spatial.dim.y/2, spatial.dim.x, spatial.dim.y);
                            }

                            if (alpha) ctx.globalAlpha = 1; // restore the alpha
                            ctx.restore();
                            pc.device.elementsDrawn++;
                        }

                        var text = entity.getComponent('text');
                        if (text)
                        {
                            ctx.save();
                            var yAdd=0;
                            if (alpha) ctx.globalAlpha = alpha.level;
                            ctx.font = text._fontCache;
                            ctx.lineWidth = text.lineWidth;

                            for (var i=0; i < text.text.length; i++)
                            {
                                // canvas text is drawn with an origin at the bottom left, so we draw at y+h, not y
                                if (text.color)
                                {
                                    ctx.fillStyle = text.color.color;
                                    ctx.fillText(text.text[i], drawX + text.offset.x, drawY + yAdd + spatial.dim.y + text.offset.y);
                                }
                                if (text.strokeColor && text.lineWidth)
                                {
                                    ctx.strokeStyle = text.strokeColor.color;
                                    ctx.strokeText(text.text[i], drawX + text.offset.x, drawY + yAdd + spatial.dim.y + text.offset.y);
                                }
                                yAdd += (text.fontHeight * 1.1);
                            }
                            if (alpha) ctx.globalAlpha = 1; // restore the alpha
                            pc.device.elementsDrawn++;
                            ctx.restore();
                        }

                        // draw debug info if required
                        var debuginfo = next.obj.getComponent('debuginfo');
                        if (debuginfo)
                        {
                            ctx.save();
                            ctx.strokeStyle='#5f5';
                            ctx.strokeRect(drawX, drawY, spatial.dim.x, spatial.dim.y);
                            ctx.restore();
                        }

                        if (clip)
                            ctx.restore();
                    }
                }
                next = next.next();
            }

            pc.device.lastDrawMS += (Date.now() - startTime);
        }

    });
















