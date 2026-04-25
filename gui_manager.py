import os
import shutil
import re
import markdown
import urllib.parse
import json
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

# 保证当前运行目录是脚本所在目录
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class BlogManagerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("🐱 KiraMyao Equal - 网站管理台")
        self.root.geometry("600x480")
        
        # 强制所需文件夹存在
        os.makedirs('article', exist_ok=True)
        os.makedirs('pic', exist_ok=True)
        
        # 加载数据库
        self.json_file = 'posts.json'
        self.posts =[]
        self.load_posts()

        # UI 布局
        self.notebook = ttk.Notebook(root)
        self.notebook.pack(fill='both', expand=True, padx=10, pady=10)

        # 标签页 1: 发布文章
        self.tab_add = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_add, text='✍️ 发布新文章')
        self.setup_add_tab()

        # 标签页 2: 管理文章
        self.tab_manage = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_manage, text='🗑️ 管理与删除')
        self.setup_manage_tab()

    def load_posts(self):
        if os.path.exists(self.json_file):
            with open(self.json_file, 'r', encoding='utf-8') as f:
                self.posts = json.load(f)
        else:
            self.posts =[]

    def save_posts(self):
        with open(self.json_file, 'w', encoding='utf-8') as f:
            json.dump(self.posts, f, ensure_ascii=False, indent=2)

    # ================= 界面设置 =================
    def setup_add_tab(self):
        frame = self.tab_add
        
        # 标题
        ttk.Label(frame, text="文章标题:").grid(row=0, column=0, sticky='w', pady=10, padx=5)
        self.entry_title = ttk.Entry(frame, width=50)
        self.entry_title.grid(row=0, column=1, columnspan=2, pady=10, padx=5)

        # 简介
        ttk.Label(frame, text="文章简介:").grid(row=1, column=0, sticky='w', pady=10, padx=5)
        self.entry_desc = ttk.Entry(frame, width=50)
        self.entry_desc.grid(row=1, column=1, columnspan=2, pady=10, padx=5)

        # Slug (文件名)
        ttk.Label(frame, text="英文文件名 (不带.html):").grid(row=2, column=0, sticky='w', pady=10, padx=5)
        self.entry_slug = ttk.Entry(frame, width=50)
        self.entry_slug.grid(row=2, column=1, columnspan=2, pady=10, padx=5)

        # 封面图
        ttk.Label(frame, text="封面图 (16:9):").grid(row=3, column=0, sticky='w', pady=10, padx=5)
        self.entry_cover = ttk.Entry(frame, width=40)
        self.entry_cover.grid(row=3, column=1, pady=10, padx=5)
        ttk.Button(frame, text="浏览...", command=self.browse_cover).grid(row=3, column=2, padx=5)

        # Markdown 文件
        ttk.Label(frame, text="Markdown 正文:").grid(row=4, column=0, sticky='w', pady=10, padx=5)
        self.entry_md = ttk.Entry(frame, width=40)
        self.entry_md.grid(row=4, column=1, pady=10, padx=5)
        ttk.Button(frame, text="浏览...", command=self.browse_md).grid(row=4, column=2, padx=5)

        # 发布按钮
        btn_submit = ttk.Button(frame, text="🚀 一键处理并发布", command=self.process_add_post)
        btn_submit.grid(row=5, column=0, columnspan=3, pady=30, ipadx=20, ipady=5)

    def setup_manage_tab(self):
        frame = self.tab_manage
        
        ttk.Label(frame, text="选中下方文章进行删除操作：").pack(pady=10, anchor='w', padx=10)
        
        # 列表框
        self.listbox = tk.Listbox(frame, width=70, height=15, font=("Microsoft YaHei", 10))
        self.listbox.pack(padx=10, pady=5)
        self.refresh_listbox()
        
        # 删除按钮
        btn_delete = ttk.Button(frame, text="🗑️ 彻底删除选中的文章", command=self.delete_post)
        btn_delete.pack(pady=15, ipadx=10, ipady=3)

    # ================= 按钮功能 =================
    def browse_cover(self):
        path = filedialog.askopenfilename(filetypes=[("Image Files", "*.png;*.jpg;*.jpeg;*.webp")])
        if path:
            self.entry_cover.delete(0, tk.END)
            self.entry_cover.insert(0, path)

    def browse_md(self):
        path = filedialog.askopenfilename(filetypes=[("Markdown Files", "*.md")])
        if path:
            self.entry_md.delete(0, tk.END)
            self.entry_md.insert(0, path)

    def refresh_listbox(self):
        self.listbox.delete(0, tk.END)
        for post in self.posts:
            self.listbox.insert(tk.END, f"[{post['slug']}] {post['title']}")

    # ================= 核心处理逻辑 =================
    def process_add_post(self):
        title = self.entry_title.get().strip()
        desc = self.entry_desc.get().strip()
        slug = self.entry_slug.get().strip()
        cover_path = self.entry_cover.get().strip()
        md_path = self.entry_md.get().strip()

        if not all([title, desc, slug, cover_path, md_path]):
            messagebox.showwarning("提示", "所有字段都必须填写！")
            return

        # 检查重名
        if any(p['slug'] == slug for p in self.posts):
            messagebox.showerror("错误", f"文件名 '{slug}' 已存在，请更换！")
            return

        # 处理封面
        cover_name = os.path.basename(cover_path)
        target_cover_path = os.path.join('pic', cover_name)
        try:
            if not os.path.exists(target_cover_path):
                shutil.copy(cover_path, target_cover_path)
        except Exception as e:
            messagebox.showerror("封面错误", str(e))
            return

        # 处理 Markdown 和图片
        try:
            with open(md_path, 'r', encoding='utf-8') as f:
                md_content = f.read()

            def process_md_image(match):
                alt_text = match.group(1)
                img_path = match.group(2)
                if img_path.startswith('http://') or img_path.startswith('https://'):
                    return match.group(0)
                
                # 清理路径前缀
                if img_path.startswith('file:///'): img_path = img_path[8:]
                elif img_path.startswith('file://'): img_path = img_path[7:]
                img_path = urllib.parse.unquote(img_path)
                if os.name == 'nt' and img_path.startswith('/') and len(img_path) > 2 and img_path[2] == ':':
                    img_path = img_path[1:]
                img_path = img_path.strip("\"'")
                
                img_name = os.path.basename(img_path)
                target_img_path = os.path.join('pic', img_name)
                try:
                    if not os.path.exists(target_img_path):
                        shutil.copy(img_path, target_img_path)
                except Exception as e:
                    print(f"图片复制失败: {e}")
                
                return f"![{alt_text}](../pic/{img_name})"

            md_content = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', process_md_image, md_content)
            html_content = markdown.markdown(md_content, extensions=['extra'])
        except Exception as e:
            messagebox.showerror("Markdown错误", str(e))
            return

        # 生成 HTML
        article_template = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | KiraMyao Equal</title>
    <link rel="icon" href="../favicon.ico" type="image/x-icon">
    <link rel="shortcut icon" href="../favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="../style.css">
</head>
<body>
    <nav class="sidebar glass-island">
        <h2>KiraMyao🐱<br>Equal</h2>
        <a href="../index.html">🏠 首页</a>
        <a href="../about.html">📖 关于我们</a>
        <div class="contact-info">
            <p>联系与报告:</p>
            <p>report@kiramayo.dpdns.org</p>
            <p style="font-size: 0.7rem; margin-top: 20px;">equal.kiramayo.dpdns.org</p>
        </div>
    </nav>
    <main class="main-content">
        <div class="top-bar-island glass-island">
            📄 REPORT / 分析报告
        </div>
        <div class="unframed-text-container article-body">
            <h1 class="colorful-text" style="font-size: 2.2rem; text-align: center; margin-top: 20px;">{title}</h1>
            <div style="margin-top: 40px;">
                {html_content}
            </div>
        </div>
    </main>
</body>
</html>"""
        article_file_path = os.path.join('article', f"{slug}.html")
        with open(article_file_path, 'w', encoding='utf-8') as f:
            f.write(article_template)

        # 更新数据库
        self.posts.insert(0, {
            "title": title,
            "desc": desc,
            "slug": slug,
            "cover_name": cover_name
        })
        self.save_posts()
        self.refresh_listbox()
        self.update_index_html()

        # 清空输入框
        self.entry_title.delete(0, tk.END)
        self.entry_desc.delete(0, tk.END)
        self.entry_slug.delete(0, tk.END)
        self.entry_cover.delete(0, tk.END)
        self.entry_md.delete(0, tk.END)
        
        messagebox.showinfo("成功", f"文章《{title}》发布成功并已更新首页！")

    def delete_post(self):
        selected_index = self.listbox.curselection()
        if not selected_index:
            messagebox.showwarning("提示", "请先选中一篇文章！")
            return
            
        index = selected_index[0]
        post = self.posts[index]
        
        confirm = messagebox.askyesno("危险操作", f"确定要彻底删除文章《{post['title']}》吗？\n该操作不可恢复！")
        if confirm:
            # 1. 删除本地 html
            html_path = os.path.join('article', f"{post['slug']}.html")
            if os.path.exists(html_path):
                os.remove(html_path)
                
            # 2. 从数据库移除
            del self.posts[index]
            self.save_posts()
            
            # 3. 更新 UI 和 首页
            self.refresh_listbox()
            self.update_index_html()
            messagebox.showinfo("完成", "文章已成功删除！")

    def update_index_html(self):
        # 根据 self.posts 重新生成首页的 HTML 列表
        html_list = ""
        for p in self.posts:
            html_list += f"""
            <a href="article/{p['slug']}.html" class="article-card-link glass-island" data-title="{p['title']}">
                <div class="article-card">
                    <div class="article-cover">
                        <img src="pic/{p['cover_name']}" alt="{p['title']}">
                    </div>
                    <h3>{p['title']}</h3>
                    <p>{p['desc']}</p>
                </div>
            </a>"""
            
        try:
            with open('index.html', 'r', encoding='utf-8') as f:
                content = f.read()
                
            # 核心：使用正则替换标记区间的内容
            pattern = re.compile(r'(<!-- POSTS_START -->).*?(<!-- POSTS_END -->)', re.DOTALL)
            new_content = pattern.sub(rf'\1{html_list}\n\2', content)
            
            with open('index.html', 'w', encoding='utf-8') as f:
                f.write(new_content)
        except Exception as e:
            messagebox.showerror("更新首页错误", str(e))

if __name__ == "__main__":
    root = tk.Tk()
    # 为避免模糊设置 DPI 感知 (Windows)
    try:
        from ctypes import windll
        windll.shcore.SetProcessDpiAwareness(1)
    except:
        pass
    app = BlogManagerApp(root)
    root.mainloop()