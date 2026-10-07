import os
import sqlite3
from datetime import datetime
from pathlib import Path
from sqlalchemy import create_engine, text
BASE=Path(__file__).resolve().parent
SQLITE_PATH=BASE/'dante.db'
url=os.getenv('DATABASE_URL')
if not url: raise SystemExit('ERRO: DATABASE_URL nao esta configurada no PowerShell.')
if url.startswith('postgres://'): url=url.replace('postgres://','postgresql+psycopg://',1)
elif url.startswith('postgresql://'): url=url.replace('postgresql://','postgresql+psycopg://',1)
if not SQLITE_PATH.exists(): raise SystemExit(f'ERRO: banco local nao encontrado: {SQLITE_PATH}')
s=sqlite3.connect(SQLITE_PATH); s.row_factory=sqlite3.Row
lessons=s.execute('SELECT id, professor_id, student_id, student_name, weekday, time, note FROM lessons ORDER BY id').fetchall()
workouts=s.execute('SELECT id, student_id, professor_id, title, content, periodization, updated_at FROM workouts ORDER BY id').fetchall(); s.close()
if len(lessons)!=3 or len(workouts)!=3: raise SystemExit(f'ERRO: esperado 3 aulas e 3 treinos; encontrados {len(lessons)} aulas e {len(workouts)} treinos.')
engine=create_engine(url,pool_pre_ping=True)
with engine.begin() as c:
    lc=c.execute(text('SELECT COUNT(*) FROM lessons')).scalar_one(); wc=c.execute(text('SELECT COUNT(*) FROM workouts')).scalar_one()
    if lc or wc: raise SystemExit(f'ERRO: Neon nao esta vazio para demos. lessons={lc}, workouts={wc}. Nada foi inserido.')
    for r in lessons:
        c.execute(text('INSERT INTO lessons (id,professor_id,student_id,student_name,weekday,time,note) VALUES (:id,:professor_id,:student_id,:student_name,:weekday,:time,:note)'),dict(r))
    for r in workouts:
        d=dict(r); d['updated_at']=datetime.fromisoformat(d['updated_at']) if isinstance(d['updated_at'],str) else d['updated_at']
        c.execute(text('INSERT INTO workouts (id,student_id,professor_id,title,content,periodization,updated_at) VALUES (:id,:student_id,:professor_id,:title,:content,:periodization,:updated_at)'),d)
    c.execute(text("SELECT setval(pg_get_serial_sequence('lessons','id'), COALESCE((SELECT MAX(id) FROM lessons),1), true)"))
    c.execute(text("SELECT setval(pg_get_serial_sequence('workouts','id'), COALESCE((SELECT MAX(id) FROM workouts),1), true)"))
with engine.connect() as c:
    print('Migracao concluida com sucesso.')
    print('Aulas no Neon:',c.execute(text('SELECT COUNT(*) FROM lessons')).scalar_one())
    print('Treinos no Neon:',c.execute(text('SELECT COUNT(*) FROM workouts')).scalar_one())
