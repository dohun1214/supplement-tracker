# 배포 가이드 - 완전 무료 PWA 호스팅

앱이 성공적으로 웹으로 빌드되었습니다! 이제 무료 호스팅에 올려서 아이폰에서 사용하세요.

## 방법 1: Vercel (추천 - 가장 쉬움)

### 1단계: GitHub에 코드 업로드
```bash
cd creatine-tracker
git init
git add .
git commit -m "Initial commit"
```

GitHub에서 새 저장소를 만든 후:
```bash
git remote add origin https://github.com/당신의아이디/creatine-tracker.git
git push -u origin main
```

### 2단계: Vercel에 배포
1. https://vercel.com 접속
2. GitHub 계정으로 로그인
3. "Add New Project" 클릭
4. GitHub에서 `creatine-tracker` 저장소 선택
5. "Deploy" 클릭 (설정 변경 없이 바로 배포)

완료! 몇 분 후 URL이 생성됩니다 (예: https://creatine-tracker.vercel.app)

---

## 방법 2: Netlify

### 1단계: GitHub에 코드 업로드 (위와 동일)

### 2단계: Netlify에 배포
1. https://netlify.com 접속
2. GitHub 계정으로 로그인
3. "Add new site" → "Import an existing project"
4. GitHub에서 `creatine-tracker` 저장소 선택
5. "Deploy" 클릭

완료! URL이 생성됩니다 (예: https://creatine-tracker.netlify.app)

---

## 방법 3: GitHub Pages (100% 무료)

```bash
cd creatine-tracker
npm install --save-dev gh-pages
```

package.json에 추가:
```json
{
  "scripts": {
    "deploy": "npx expo export --platform web && gh-pages -d dist"
  },
  "homepage": "https://당신의아이디.github.io/creatine-tracker"
}
```

배포:
```bash
npm run deploy
```

완료! https://당신의아이디.github.io/creatine-tracker 에서 접속

---

## 아이폰에서 PWA로 설치하기

1. Safari에서 배포된 URL 접속
2. 하단의 "공유" 버튼 클릭
3. "홈 화면에 추가" 선택
4. "추가" 클릭

이제 홈 화면에서 앱 아이콘을 눌러 실제 앱처럼 사용할 수 있습니다!

---

## 로컬에서 테스트

배포 전에 웹 버전을 로컬에서 테스트하려면:

```bash
cd creatine-tracker
npx expo start --web
```

브라우저에서 http://localhost:8081 로 접속해서 확인하세요.

---

## 업데이트 방법

코드를 수정한 후:

```bash
git add .
git commit -m "업데이트 내용"
git push
```

Vercel/Netlify가 자동으로 새 버전을 배포합니다!

---

## 문제 해결

### 빌드 실패 시
```bash
cd creatine-tracker
rm -rf node_modules dist
npm install
npx expo export --platform web
```

### 데이터가 안 보일 때
- PWA는 브라우저 저장소를 사용합니다
- 브라우저 데이터 삭제 시 기록도 삭제됩니다
- Safari 설정 → 고급 → 웹사이트 데이터에서 확인 가능

---

## 주의사항

✅ 완전 무료
✅ 재설치 불필요
✅ 데이터 영구 저장
✅ 오프라인 작동 (캐시 후)
✅ 자동 업데이트

⚠️ Safari 브라우저 필수 (크롬은 iOS PWA 제한 있음)
⚠️ 브라우저 데이터 삭제 시 기록도 삭제
