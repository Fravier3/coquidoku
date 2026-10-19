import random,json,time
from pathlib import Path
random.seed(41397)
N=8

def solve(g,limit=2):
 out=[]
 def rec(r,cols,regs,p):
  if len(out)>=limit:return
  if r==8:out.append(p);return
  for c in range(8):
   z=g[r*8+c]
   if c not in cols and z not in regs and (not p or abs(p[-1]-c)>1):rec(r+1,cols|{c},regs|{z},p+[c])
 rec(0,set(),set(),[])
 return out

def make():
 while True:
  p=list(range(8));random.shuffle(p)
  if all(abs(p[i]-p[i-1])>1 for i in range(1,8)):break
 g=[-1]*64
 for r,c in enumerate(p):g[r*8+c]=r
 frontier=[]
 def add(i):
  r,c=divmod(i,8)
  for rr,cc in [(r-1,c),(r+1,c),(r,c-1),(r,c+1)]:
   if 0<=rr<8 and 0<=cc<8 and g[rr*8+cc]<0:frontier.append((rr*8+cc,g[i]))
 for r,c in enumerate(p):add(r*8+c)
 while frontier:
  k=random.randrange(len(frontier));i,z=frontier.pop(k)
  if g[i]>=0:continue
  g[i]=z;add(i)
 return g,p

boards=[];attempts=0;t=time.time()
while len(boards)<60:
 attempts+=1;g,p=make();sizes=[g.count(z) for z in range(8)]
 if min(sizes)<2:continue
 ss=solve(g)
 if len(ss)==1:
  boards.append({'regions':g,'solution':ss[0]})
Path(__file__).parents[1].joinpath('puzzles.json').write_text(json.dumps(boards,separators=(',',':')))
print(f'{len(boards)} unique connected 8x8 boards, {attempts} candidates, {time.time()-t:.1f}s')
