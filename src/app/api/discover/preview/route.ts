export async function GET() {

  const events = [
    {
      title: "Sunburn Goa",
      city: "Goa",
      eventLink: "https://bookmyshow.com/sunburn"
    },
    {
      title: "Comedy Night",
      city: "Bangalore",
      eventLink: "https://district.com/comedy"
    }
  ];

  return Response.json(events);
}