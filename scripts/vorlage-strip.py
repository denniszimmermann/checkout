import sys, hashlib
from pptx import Presentation
from pptx.oxml.ns import qn
src, dst, BG = sys.argv[1], sys.argv[2], sys.argv[3]
from lxml import etree
DROP_IMG = {'54c94919', 'db27ccfb', '5be60d4f', '027a51e9'}
p = Presentation(src)
C = 360000.0
def clear(tree):
    for ch in list(tree):
        if ch.tag.split('}')[1] in ('sp','pic','grpSp','cxnSp','graphicFrame'): tree.remove(ch)
for m in p.slide_masters:
    clear(m.shapes._spTree)
    for l in m.slide_layouts: clear(l.shapes._spTree)
def strip(el, slide, top=True):
    for ch in list(el):
        tag = ch.tag.split('}')[1]
        if tag == 'grpSp':
            if top:
                off = ch.find(qn('p:grpSpPr')).find(qn('a:xfrm')).find(qn('a:off'))
                x, y = int(off.get('x'))/C, int(off.get('y'))/C
                if x > 28 and y < 4.5: el.remove(ch); continue      # Navigator
                if x < 2 and y < 5.5 and slide not in (4, 22): el.remove(ch); continue  # Checkboxen
            strip(ch, slide, False)
            if not any(c.tag.split('}')[1] in ('sp','pic','grpSp') for c in ch): el.remove(ch)
        elif tag in ('cxnSp', 'graphicFrame'): el.remove(ch)
        elif tag == 'sp':
            txt = ''.join(t.text or '' for t in ch.iter(qn('a:t'))).strip()
            geom = ch.find(qn('p:spPr')).find(qn('a:prstGeom'))
            ext = ch.find(qn('p:spPr')).find(qn('a:xfrm'))
            gross = slide == 7 and ext is not None and int(ext.find(qn('a:ext')).get('cx'))/C > 10
            if txt or gross or (geom is not None and geom.get('prst') in ('upArrow','line')): el.remove(ch)
        elif tag == 'pic':
            blip = ch.find('.//'+qn('a:blip'))
            part = CUR.part.related_part(blip.get(qn('r:embed')))
            if hashlib.sha1(part.blob).hexdigest()[:8] in DROP_IMG: el.remove(ch)
for i, s in enumerate(p.slides, 1):
    CUR = s
    strip(s.shapes._spTree, i)
for m in p.slide_masters:
    for obj in [m] + list(m.slide_layouts):
        cSld = obj._element.find(qn('p:cSld'))
        old = cSld.find(qn('p:bg'))
        if old is not None: cSld.remove(old)
        bg = etree.fromstring('<p:bg xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:bgPr><a:solidFill><a:srgbClr val="%s"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>' % BG)
        cSld.insert(0, bg)
for s in p.slides:
    cSld = s._element.find(qn('p:cSld')); old = cSld.find(qn('p:bg'))
    if old is not None: cSld.remove(old)
p.save(dst)
