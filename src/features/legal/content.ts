import type { AppLocale } from '@/lib/formatNumber';
import { SUPPORT_EMAIL } from '@/lib/contact';

export type LegalDoc = 'terms' | 'privacy';

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalText {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

/** Date of the current wording; bump it whenever the text changes. */
export const LEGAL_UPDATED = '2026-10-22';

// TODO(legal): have a lawyer review both documents before the store release.
const CONTENT: Record<AppLocale, Record<LegalDoc, LegalText>> = {
  ar: {
    terms: {
      title: 'شروط الاستخدام',
      updated: 'آخر تحديث',
      intro:
        'مرحبًا بك في مُجاز. باستخدامك للتطبيق فإنك توافق على هذه الشروط، فاقرأها بعناية. إن لم توافق عليها فلا تستخدم التطبيق.',
      sections: [
        {
          heading: 'ما يقدّمه مُجاز',
          paragraphs: [
            'مُجاز منصّة تصل الطلاب بمشايخ ومعلّمات يحملون إجازة بسند متصل في القرآن الكريم، لحجز جلسات مباشرة فردية عبر الصوت والصورة، ومتابعة الختمة صفحةً صفحة، وإصدار إجازة رقمية يمكن التحقق منها.',
            'المشايخ مستقلّون وليسوا موظفين لدى مُجاز. نراجع وثائق كل شيخ قبل ظهوره في التطبيق، لكن مضمون التعليم ومنح الإجازة قرار الشيخ وحده.',
          ],
        },
        {
          heading: 'الحساب',
          paragraphs: [
            'يجب أن تكون بياناتك صحيحة، وأن تحافظ على سرّية كلمة المرور. أنت مسؤول عن كل ما يجري من خلال حسابك.',
            'إن كان عمر الطالب دون الثامنة عشرة فيجب أن يُنشئ الحساب ويتابعه وليّ أمره.',
            'يمكنك حذف حسابك في أي وقت من صفحة الحساب.',
          ],
        },
        {
          heading: 'الحجز والإلغاء',
          paragraphs: [
            'تُعرض المواعيد بتوقيتك المحلي. لكل طالب جلسة تجريبية مجانية واحدة مدتها ٣٠ دقيقة مع كل شيخ.',
            'يمكن للطالب إلغاء الجلسة أو تغيير موعدها حتى ٦ ساعات قبل بدئها. يُفتح الانضمام إلى الجلسة قبل ١٠ دقائق من موعدها.',
            'الأسعار معروضة بالدولار الأمريكي، ويسري السعر الظاهر عند الحجز.',
          ],
        },
        {
          heading: 'الجلسات المباشرة',
          paragraphs: [
            'لا تُسجَّل الجلسات صوتًا ولا صورة. يدوّن الشيخ بعد كل جلسة الصفحات التي قُرئت وملاحظاته عليها، ويظهر ذلك في سجل ختمتك.',
            'يجب الالتزام بآداب مجلس القرآن: الاحترام، واللباس المحتشم، وعدم تصوير الجلسة أو نشرها دون إذن الطرف الآخر.',
          ],
        },
        {
          heading: 'الإجازة',
          paragraphs: [
            'لا تُصدر الإجازة إلا بعد إتمام قراءة المصحف كاملًا (٦٠٤ صفحات) على الشيخ، وبقرار منه. لكل إجازة رمز تحقق علني يمكن لأي شخص التأكد منه.',
            'تُحفظ بيانات الإجازة كما صدرت، ولا يمكن تعديلها. يحق لإدارة مُجاز إلغاء إجازة ثبت أنها صدرت بغير حق، ويظهر ذلك عند التحقق منها.',
          ],
        },
        {
          heading: 'السلوك الممنوع',
          paragraphs: [
            'يُمنع انتحال شخصية الغير، أو تقديم وثائق مزوّرة، أو الإساءة إلى أي مستخدم، أو محاولة الوصول إلى بيانات الآخرين أو تعطيل الخدمة. يحق لنا إيقاف أي حساب يخالف ذلك.',
          ],
        },
        {
          heading: 'حدود المسؤولية',
          paragraphs: [
            'نقدّم التطبيق «كما هو»، ونسعى إلى أن يعمل دون انقطاع، لكننا لا نضمن ذلك. لا يتحمل مُجاز مسؤولية ما يجري بين الطالب والشيخ خارج التطبيق.',
          ],
        },
        {
          heading: 'التعديلات والتواصل',
          paragraphs: [
            'قد نعدّل هذه الشروط، وسنعلمك بأي تغيير جوهري داخل التطبيق. تخضع هذه الشروط لقوانين المملكة الأردنية الهاشمية.',
            `للتواصل: ${SUPPORT_EMAIL}`,
          ],
        },
      ],
    },
    privacy: {
      title: 'سياسة الخصوصية',
      updated: 'آخر تحديث',
      intro:
        'تشرح هذه السياسة ما نجمعه من بيانات، ولماذا، ومن يطّلع عليها، وكيف تتحكم فيها. لا نبيع بياناتك ولا نستعملها للإعلانات.',
      sections: [
        {
          heading: 'ما نجمعه',
          paragraphs: [
            'بيانات الحساب: الاسم، والبريد الإلكتروني، وكلمة المرور (مشفّرة)، والجنس، والبلد، والمنطقة الزمنية، واللغة، وتفضيلاتك (الرواية والهدف وتفضيل المعلّمات).',
            'بيانات الشيخ: النبذة، والسند، واسم الشيخ المُجيز، والخبرة، والأسعار، والمواعيد المتاحة، وصور الإجازات والوثائق المرفوعة للتحقق.',
            'بيانات التعلّم: الحجوزات، والصفحات المقروءة، وملاحظات الشيخ والأخطاء المدوّنة، والتقييمات، والإجازات الصادرة.',
            'بيانات الجهاز: رمز الإشعارات إن سمحت بها. نستخدم الكاميرا والميكروفون أثناء الجلسة المباشرة فقط، والكاميرا لمسح رمز التحقق.',
          ],
        },
        {
          heading: 'لماذا نستخدمها',
          paragraphs: [
            'لتشغيل الحساب والحجز والجلسات، ولعرض الشيوخ المناسبين لك، ولحفظ تقدّم ختمتك، ولإصدار الإجازة والتحقق منها، ولإرسال تذكير قبل الجلسات، ولحماية المنصّة من إساءة الاستخدام.',
          ],
        },
        {
          heading: 'من يطّلع عليها',
          paragraphs: [
            'الشيخ الذي تحجز معه يرى اسمك وبيانات جلساتك معه وتقدّم ختمتك عنده. يظهر الملف العام للشيخ لكل المستخدمين، أما وثائقه فلا يراها إلا هو والإدارة.',
            'عند التحقق من إجازة يظهر للعموم: اسم حامل الإجازة، واسم الشيخ، والرواية، وتاريخ الإصدار، والسند.',
            'نعتمد على مزوّدي خدمة يعالجون البيانات نيابةً عنّا فقط: Supabase (الاستضافة وقاعدة البيانات)، وDaily.co (الاتصال المرئي، دون تسجيل)، وExpo (الإشعارات)، وResend (البريد الإلكتروني).',
          ],
        },
        {
          heading: 'الاحتفاظ والحذف',
          paragraphs: [
            'نحتفظ ببياناتك ما دام حسابك قائمًا. عند حذف الحساب من صفحة الحساب نحذف ملفك وحجوزاتك وتقدّمك ووثائقك نهائيًا.',
            'تبقى الإجازات الصادرة قابلةً للتحقق برمزها بعد حذف الحساب، لأن صاحبها قد يحتاج إلى إثباتها.',
          ],
        },
        {
          heading: 'حقوقك',
          paragraphs: [
            'يمكنك الاطلاع على بياناتك وتعديلها من داخل التطبيق، وطلب نسخة منها أو حذفها بمراسلتنا. يمكنك إيقاف الإشعارات في أي وقت.',
          ],
        },
        {
          heading: 'الأمان والتواصل',
          paragraphs: [
            'تنتقل البيانات مشفّرة، ولا يصل كل مستخدم إلا إلى بياناته. لا نخزّن مفاتيح خدمة الاتصال داخل التطبيق.',
            `لأي سؤال عن الخصوصية: ${SUPPORT_EMAIL}`,
          ],
        },
      ],
    },
  },
  en: {
    terms: {
      title: 'Terms of use',
      updated: 'Last updated',
      intro:
        'Welcome to Mujaz. By using the app you agree to these terms, so please read them carefully. If you do not agree, do not use the app.',
      sections: [
        {
          heading: 'What Mujaz provides',
          paragraphs: [
            'Mujaz connects students with sheikhs and teachers who hold an Ijazah with a connected sanad in the Quran. Students book one-to-one live audio and video sessions, track their khatmah page by page, and receive a digital Ijazah that anyone can verify.',
            'Sheikhs are independent and are not employees of Mujaz. We review each sheikh’s documents before they appear in the app, but the teaching and the decision to grant an Ijazah belong to the sheikh alone.',
          ],
        },
        {
          heading: 'Your account',
          paragraphs: [
            'Your details must be accurate and your password kept private. You are responsible for everything done through your account.',
            'If the student is under 18, a parent or guardian must create and supervise the account.',
            'You can delete your account at any time from the Account screen.',
          ],
        },
        {
          heading: 'Booking and cancelling',
          paragraphs: [
            'Times are shown in your local time zone. Each student gets one free 30-minute trial session with each sheikh.',
            'Students can cancel or reschedule up to 6 hours before a session starts. Joining opens 10 minutes before the start time.',
            'Prices are shown in US dollars; the price shown when you book applies.',
          ],
        },
        {
          heading: 'Live sessions',
          paragraphs: [
            'Sessions are not recorded, in audio or video. After each session the sheikh records the pages read and their notes, which appear in your khatmah record.',
            'Keep the etiquette of a Quran gathering: be respectful, dress modestly, and do not record or share a session without the other person’s permission.',
          ],
        },
        {
          heading: 'The Ijazah',
          paragraphs: [
            'An Ijazah is issued only after the whole mushaf (604 pages) has been recited to the sheikh, and only by the sheikh’s decision. Each Ijazah has a public verification code anyone can check.',
            'An Ijazah is kept exactly as issued and cannot be edited. Mujaz may revoke an Ijazah that was issued improperly; a revoked Ijazah shows as revoked when verified.',
          ],
        },
        {
          heading: 'Not allowed',
          paragraphs: [
            'Impersonating someone, submitting forged documents, abusing other users, trying to access other people’s data or disrupting the service are not allowed. We may suspend any account that does so.',
          ],
        },
        {
          heading: 'Liability',
          paragraphs: [
            'The app is provided “as is”. We work to keep it running without interruption but cannot guarantee it. Mujaz is not responsible for arrangements between a student and a sheikh made outside the app.',
          ],
        },
        {
          heading: 'Changes and contact',
          paragraphs: [
            'We may update these terms and will tell you in the app about any significant change. These terms are governed by the laws of the Hashemite Kingdom of Jordan.',
            `Contact: ${SUPPORT_EMAIL}`,
          ],
        },
      ],
    },
    privacy: {
      title: 'Privacy policy',
      updated: 'Last updated',
      intro:
        'This policy explains what data we collect, why, who can see it and how you control it. We do not sell your data or use it for advertising.',
      sections: [
        {
          heading: 'What we collect',
          paragraphs: [
            'Account data: name, email, password (hashed), gender, country, time zone, language and your preferences (riwayah, goal, female teachers only).',
            'Sheikh data: bio, sanad, granting sheikh, experience, prices, availability, and the Ijazah certificates and documents uploaded for verification.',
            'Learning data: bookings, pages recited, the sheikh’s notes and recorded mistakes, ratings and issued Ijazahs.',
            'Device data: a push notification token if you allow notifications. The camera and microphone are used only during a live session, and the camera to scan a verification code.',
          ],
        },
        {
          heading: 'Why we use it',
          paragraphs: [
            'To run your account, bookings and sessions; to show sheikhs that match you; to keep your khatmah progress; to issue and verify Ijazahs; to remind you before sessions; and to protect the platform from abuse.',
          ],
        },
        {
          heading: 'Who can see it',
          paragraphs: [
            'A sheikh you book sees your name, your sessions with them and your khatmah progress with them. A sheikh’s public profile is visible to all users; their documents are visible only to them and to the admins.',
            'Verifying an Ijazah publicly shows the holder’s name, the sheikh’s name, the riwayah, the issue date and the sanad.',
            'We rely on service providers that process data only on our behalf: Supabase (hosting and database), Daily.co (video calls, not recorded), Expo (notifications) and Resend (email).',
          ],
        },
        {
          heading: 'Keeping and deleting',
          paragraphs: [
            'We keep your data while your account exists. When you delete your account from the Account screen, your profile, bookings, progress and documents are permanently deleted.',
            'Issued Ijazahs stay verifiable by their code after the account is deleted, because the holder may need to prove them.',
          ],
        },
        {
          heading: 'Your rights',
          paragraphs: [
            'You can view and edit your data in the app, and ask us for a copy or for deletion by email. You can turn off notifications at any time.',
          ],
        },
        {
          heading: 'Security and contact',
          paragraphs: [
            'Data is encrypted in transit, and each user can reach only their own data. The video service keys are never stored in the app.',
            `Privacy questions: ${SUPPORT_EMAIL}`,
          ],
        },
      ],
    },
  },
};

export function legalText(doc: LegalDoc, locale: AppLocale): LegalText {
  return CONTENT[locale][doc];
}
