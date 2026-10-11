# -*- coding: utf-8 -*-
"""启动脚本：python run.py [--port 8000] [--db PATH]

框架保留此脚本（启动胶水，无业务逻辑），可直接使用。
"""
import argparse


def main():
    parser = argparse.ArgumentParser(description="壁画结构化语义标注系统")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--db", default=None, help="SQLite 数据库路径（默认项目根目录 mural.db）")
    args = parser.parse_args()

    if args.db:
        import os
        os.environ["MURAL_DB_PATH"] = args.db

    import uvicorn
    uvicorn.run("backend.main:app", host=args.host, port=args.port)


if __name__ == "__main__":
    main()
