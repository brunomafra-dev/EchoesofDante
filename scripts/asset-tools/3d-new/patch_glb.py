import json, struct, sys, glob
def patch(path):
    b = open(path, 'rb').read()
    jl = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    rest = b[20 + jl:]
    for m in j['materials']:
        n = (m.get('name') or '').lower()
        if n.endswith('.body') or 'low-poly' in n or 'high-poly' in n or any(k in n for k in ('matcreator','culturalibre','donitz','rehmanpolanski','toigo','joachip','thegreatengineer','worksuit')):
            m['alphaMode'] = 'OPAQUE'
            m.pop('alphaCutoff', None)
        else:
            m['alphaMode'] = 'MASK'
            m['alphaCutoff'] = 0.5
        m['doubleSided'] = n.endswith(('hair', 'eyelashes02')) or 'hair' in n or 'ponytail' in n or 'eyebrow' in n or 'eyelash' in n
    js = json.dumps(j, separators=(',', ':')).encode('utf8')
    js += b' ' * ((4 - len(js) % 4) % 4)
    out = b[:12] + struct.pack('<I', 0) + struct.pack('<I', 0x4E4F534A) + js + rest
    # rewrite chunk length and total length
    out = b[:8] + struct.pack('<I', len(js) + 20 + len(rest)) + struct.pack('<I', len(js)) + b[16:20] + js + rest
    open(path, 'wb').write(out)
    print('patched', path)
for p in glob.glob(sys.argv[1]): patch(p)
