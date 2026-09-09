import ast, json
from pathlib import Path
path = Path('notebooks/preprocessing/04_hm_preprocessing.ipynb')
nb = json.loads(path.read_text(encoding='utf-8'))
code = [''.join(cell.get('source', [])) for cell in nb['cells'] if cell.get('cell_type') == 'code']
for number, source in enumerate(code, 1):
    compile(source, f'<notebook cell {number}>', 'exec')
source = '\n\n'.join(code)
tree = ast.parse(source)
functions = {}
for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef):
        functions.setdefault(node.name, []).append(node)
assert len(functions.get('build_train_examples', [])) == 1
assert len(functions.get('build_eval_examples', [])) == 1
assert 'FAST_DEV_RUN = True' in source
for text in ('MAX_TRANSACTIONS_DEV = 10_000', 'MAX_CUSTOMERS_DEV = 300', 'TRAIN_NEGATIVES_PER_POSITIVE = 2', 'MIN_EVAL_CANDIDATES_PER_CUSTOMER = 30'):
    assert text in source, text
assert source.count('time.perf_counter()') >= 4
assert 'Train examples built in' in source
assert 'split_name.capitalize()' in source
assert '_article_lookup(article_features)' in source
assert 'article_features[article_features' not in source
assert 'positive_articles.intersection(negative_articles)' in source
assert 'pd.concat([train, valid], ignore_index=True)' in source
assert 'date_ranges' in source
print(f'PASS: valid JSON; {len(code)} Python cells compile')
print('PASS: FAST_DEV limits and timing logs present for train/validation/test')
print('PASS: article lookup and incremental customer state present')
print('PASS: no repeated article DataFrame filtering in builder cell')
print('PASS: leakage and overlap protections remain present')
print('PASS: one definition per example builder')
print('INFO: no notebook cells executed; no model training run')
print('INFO: kernel/environment unchanged; existing repository .venv remains the configured environment')
