# Funzi Flutter client

Second frontend for Funzi. The existing React/Vite client remains intact.

## Setup

1. Install Flutter and FlutterFire CLI.
2. From this directory run `flutterfire configure` and select the same Firebase project used by the web client. This replaces `lib/firebase_options.dart` with real platform configuration.
3. Enable the same Firebase Authentication providers.
4. Run `flutter pub get`.
5. Run `flutter run`.

The client calls the existing protected Cloud Functions. Notebook submission, challenges, collaboration membership, sensor evidence and assessment remain server-authoritative.

Do not commit service-account keys or private Firebase credentials.
