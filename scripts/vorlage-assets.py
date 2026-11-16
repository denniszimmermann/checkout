import sys, io, base64, json, hashlib
from PIL import Image, ImageOps
from pptx import Presentation
S, out = sys.argv[1], sys.argv[2]
PX = 110/2.54
A = {}; META = {}
def enc(im, fmt, **kw):
    b = io.BytesIO(); im.save(b, fmt, **kw); 
    return f"data:image/{'jpeg' if fmt=='JPEG' else 'png'};base64," + base64.b64encode(b.getvalue()).decode(), len(b.getvalue())
def crop(slide, box, name, flip=False, tight=True):
    import numpy as np
    w_ = np.asarray(Image.open(f'{S}/strip/w-{slide:02d}.png').convert('RGB')).astype(float)
    b_ = np.asarray(Image.open(f'{S}/strip/b-{slide:02d}.png').convert('RGB')).astype(float)
    al = np.clip(1 - (w_ - b_).mean(axis=2)/255.0, 0, 1)
    rgb = np.where(al[...,None] > 0.02, np.clip(b_/np.maximum(al[...,None], 0.02), 0, 255), 0)
    im = Image.fromarray(np.dstack([rgb, al*255]).astype('uint8'), 'RGBA')
    x0,y0,x1,y1 = [int(round(v*PX)) for v in box]
    c = im.crop((x0,y0,x1,y1))
    bb = c.getchannel('A').point(lambda a: 255 if a>8 else 0).getbbox() if tight else (0,0,c.width,c.height)
    c = c.crop(bb)
    bx = [x0/PX + bb[0]/PX, y0/PX + bb[1]/PX, (bb[2]-bb[0])/PX, (bb[3]-bb[1])/PX]
    if flip: c = ImageOps.mirror(c)
    q = c.quantize(colors=200, method=Image.Quantize.FASTOCTREE)
    A[name], n = enc(q, 'PNG', optimize=True)
    META[name] = dict(box=[round(v,3) for v in bx], px=[c.width, c.height])
    print(name, c.size, n, META[name]['box'])
crop(9,  (5.3, 5.3, 28.9, 15.9), 'tandem')
crop(13, (7.3, 5.0, 27.7, 15.5), 'einzel')
crop(7,  (6.812, 3.371, 28.217, 16.256), 'info', flip=True, tight=False)
crop(20, (3.2, 2.9, 15.3, 16.6), 'gondel')
crop(4,  (1.5, 4.2, 10.4, 15.2), 'drauf_info')
crop(4,  (10.8, 4.4, 13.5, 7.35), 'drauf_sco')
crop(4,  (14.4, 4.2, 19.8, 14.4), 'drauf_tandem')
crop(4,  (26.3, 4.2, 32.3, 14.4), 'drauf_einzel')
def raw(fn, name, size=None, fmt='JPEG', **kw):
    im = Image.open(f'{S}/media/{fn}')
    if size: im = im.resize(size, Image.LANCZOS)
    if fmt=='JPEG': im = im.convert('RGB')
    A[name], n = enc(im, fmt, **kw); META[name] = dict(px=list(im.size)); print(name, im.size, n)
raw('dd72108f.jpg', 'metall', (1280, 720), quality=62)
raw('0fb7c8bf.jpg', 'abschnitt', (1254, 700), quality=60)
raw('54c94919.png', 'regalrahmen', None, 'PNG', optimize=True)
# Titelfolie: Logo + Band
p = Presentation(f'{S}/pptx/in/vorlage.pptx')
from pptx.oxml.ns import qn
s = p.slides[0]
for sh in s.shapes:
    bl = sh._element.find('.//'+qn('a:blip'))
    if bl is None: continue
    part = s.part.related_part(bl.get(qn('r:embed')))
    im = Image.open(io.BytesIO(part.blob)); print('slide1', sh.name, im.size, im.mode, len(part.blob))
    key = 'logo_edeka' if 'platzhalter' in sh.name.lower() else 'titelband'
    if key == 'logo_edeka':
        im.thumbnail((420, 560)); A[key], n = enc(im.convert('RGBA'), 'PNG', optimize=True)
    else:
        im = im.resize((980, 355)); A[key], n = enc(im.convert('RGBA').quantize(colors=64, method=Image.Quantize.FASTOCTREE), 'PNG', optimize=True)
    META[key] = dict(px=list(im.size)); print(' ->', key, im.size, n)
with open(out, 'w') as f:
    f.write('// Automatisch erzeugt aus der PowerPoint-Vorlage (scripts/vorlage-assets.py). Nicht von Hand ändern.\n/* eslint-disable */\n')
    f.write('export const META = ' + json.dumps(META) + ' as const;\n')
    f.write('export const BILD = {\n' + ''.join(f'  {k}: {json.dumps(v)},\n' for k, v in A.items()) + '} as const;\n')
print('total', sum(len(v) for v in A.values()))
