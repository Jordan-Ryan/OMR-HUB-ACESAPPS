interface EventPageProps {
  params: { id: string };
}

export default function EventDeepLinkPage({ params }: EventPageProps) {
  const { id } = params;

  return (
    <main>
      <h1>Open in OMR Hub</h1>
      <p>Event ID: {id}</p>
      <p>
        If you have the OMR Hub app installed, this link should open directly
        in the app. If not, you can download it from the App Store:
      </p>
      <a href="https://apps.apple.com/gb/app/omr-hub/id6755069825">
        Open in App Store
      </a>
    </main>
  );
}




