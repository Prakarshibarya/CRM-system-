export async function GET() {

  const events = [
    {
      title: "Sunburn Goa EDM Night",
      platform: "BookMyShow",
      city: "Goa",
      venue: "Vagator Beach",
      eventName: "Sunburn Festival",
      eventLink: "https://bookmyshow.com/sunburn",
    },
    {
      title: "Comedy Night Bangalore",
      platform: "BookMyShow",
      city: "Bangalore",
      venue: "Indiranagar",
      eventName: "Standup Special",
      eventLink: "https://bookmyshow.com/comedy",
    },
  ];

  return Response.json(events);
}