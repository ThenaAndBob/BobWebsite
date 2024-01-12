import sqlite3

con = sqlite3.connect("./payments.db")
cur = con.cursor()

cur.execute("INSERT INTO payments VALUES ('I4', 'B4', '25')")
con.commit()