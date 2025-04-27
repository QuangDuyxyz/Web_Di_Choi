# FriendVerse Chronicles Hub

![FriendVerse Logo](https://api.dicebear.com/7.x/identicon/svg?seed=FriendVerse&backgroundColor=b6e3f4)

FriendVerse Chronicles Hub là một ứng dụng web interactiv được thiết kế để tạo và quản lý timeline cho nhóm bạn bè, ghi lại những kỷ niệm và sự kiện đáng nhớ cùng nhau. Ứng dụng cung cấp nhiều tính năng như đăng nhập/đăng ký, quản lý thành viên, chat nhóm, và tổ chức sự kiện, tạo nên một không gian kỷ niệm trực tuyến cho nhóm bạn thân.

## 📋 Tính năng chính

- **Hệ thống tài khoản**: Đăng ký, đăng nhập và quản lý hồ sơ cá nhân
- **Timeline sự kiện**: Xem và quản lý các sự kiện theo dòng thời gian
- **Quản lý thành viên**: Xem danh sách thành viên và thông tin chi tiết
- **Chat nhóm**: Trò chuyện với các thành viên trong nhóm
- **Thêm sự kiện** (Chỉ Admin): Tạo và quản lý các sự kiện mới
- **Giao diện đáp ứng**: Hoạt động tốt trên cả máy tính và thiết bị di động
- **Chế độ sáng/tối**: Tùy chỉnh giao diện theo sở thích

## 🛠️ Công nghệ sử dụng

- **Frontend**:
  - React
  - TypeScript
  - Tailwind CSS
  - shadcn/ui (UI components library)
  - Framer Motion (Animations)
  - React Router (Routing)

- **Bảo mật & Xác thực**:
  - JSON Web Tokens (JWT)
  - Bảo vệ route với React Router
  - Mã hóa mật khẩu

- **Lưu trữ dữ liệu**:
  - LocalStorage (cho mode phát triển)
  - Supabase (cho production, nếu cần)

## 🚀 Cài đặt và Sử dụng

### Yêu cầu hệ thống

- Node.js (v16+)
- npm hoặc yarn

### Các bước cài đặt

1. Clone dự án:
   ```bash
   git clone https://github.com/QuangDuyxyz/Web_Di_Choi.git
   cd Web_Di_Choi
   ```

2. Cài đặt các dependencies:
   ```bash
   npm install
   # hoặc
   yarn install
   ```

3. Chạy ứng dụng ở môi trường development:
   ```bash
   npm run dev
   # hoặc
   yarn dev
   ```

4. Mở trình duyệt và truy cập: `http://localhost:5173`


## 📂 Cấu trúc dự án

```
src/
├── components/     # UI Components
├── contexts/       # React Contexts
├── data/           # Mock data
├── integrations/   # External integrations
├── lib/            # Utility functions
├── pages/          # Main pages
├── styles/         # CSS styles
└── types/          # TypeScript type definitions
```

## 🌟 Tính năng đã cải thiện

- **Quản lý trạng thái đăng nhập**: Lưu trữ và kiểm tra trạng thái đăng nhập một cách nhất quán
- **Bảo vệ Route**: Chỉ cho phép người dùng đã xác thực truy cập các trang cần xác thực
- **Quản lý lịch sử chuyển hướng**: Ngăn chặn việc quay lại trang đăng nhập sau khi đã đăng nhập thành công
- **Xử lý lỗi**: Cải thiện thông báo lỗi và trải nghiệm người dùng

## 📱 Giao diện

Ứng dụng có giao diện hiện đại và dễ sử dụng, với các thành phần UI như:

- Header có menu điều hướng
- Timeline hiển thị các sự kiện theo thứ tự thời gian
- Trang thành viên với danh sách và thông tin chi tiết
- Giao diện chat nhóm thân thiện
- Form thêm sự kiện trực quan

## 📄 Giấy phép

© 2025 FriendVerse Chronicles Hub. Đã đăng ký bản quyền.

---

Phát triển bởi QuangDuyxyz - Hệ thống lưu trữ kỷ niệm cho những nhóm bạn thân.
