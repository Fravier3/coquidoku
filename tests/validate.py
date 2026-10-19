import json,re
from pathlib import Path
root=Path(__file__).parents[1]
boards=json.loads((root/'puzzles.json').read_text())
assert len(boards)==60
seen=set()
for number,p in enumerate(boards,1):
 g=p['regions'];s=p['solution']
 assert len(g)==64 and set(g)==set(range(8))
 assert tuple(g) not in seen;seen.add(tuple(g))
 assert sorted(s)==list(range(8))
 assert len({g[r*8+c] for r,c in enumerate(s)})==8
 assert all(abs(s[r]-s[r-1])>1 for r in range(1,8))
 for z in range(8):
  cells={i for i in range(64) if g[i]==z};reached={next(iter(cells))};stack=list(reached)
  while stack:
   i=stack.pop();r,c=divmod(i,8)
   for rr,cc in [(r-1,c),(r+1,c),(r,c-1),(r,c+1)]:
    j=rr*8+cc
    if 0<=rr<8 and 0<=cc<8 and j in cells and j not in reached:reached.add(j);stack.append(j)
  assert reached==cells
 found=[]
 def walk(r,cols,regions,prev,path):
  if len(found)>1:return
  if r==8:found.append(path);return
  for c in range(8):
   z=g[r*8+c]
   if cols&(1<<c) or regions&(1<<z) or (r and abs(c-prev)<=1):continue
   walk(r+1,cols|(1<<c),regions|(1<<z),c,path+[c])
 walk(0,0,0,-10,[])
 assert found==[s],number
html=(root/'index.html').read_text()
for ref in re.findall(r'(?:src|href)="([^"]+)"',html):
 assert (root/ref.split('?')[0]).is_file(),ref
manifest=json.loads((root/'manifest.webmanifest').read_text())
for icon in manifest['icons']:assert (root/icon['src']).is_file()
print('PASS: 60 unique 8×8 puzzles; one solution each; connected regions; valid assets and manifest.')
