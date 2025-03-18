import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { prompt, type } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    let systemPrompt = ''
    
    if (type === 'craft') {
      systemPrompt = 'You are an email writing assistant. Based on the user\'s idea, generate 5-7 questions that would help create a comprehensive, well-structured email. The questions should cover key details needed to draft a complete email. Format each question with [QUESTION], [TYPE], [OPTIONS] for CHOICES, and [END] tags. For CHOICES questions, think creatively about diverse, thoughtful options that cover a range of possible approaches.'
    } else if (type === 'breakdown') {
      systemPrompt = 'You are analyzing an email that requires a reply. Extract EXACTLY the questions and key points that need to be addressed in the response. Format your response with specific points strictly following this format:\n\n[QUESTION]: (Copy the EXACT text of questions or key points from the email)\n[TYPE]: (One of: TEXT, CHOICES, DATE, TIME, NUMBER)\n[OPTIONS]: (Only for CHOICES type - provide 4-6 creative, diverse options that represent different possible approaches to responding, separated by commas)\n[END]\n\nIMPORTANT: \n1. Use the EXACT wording from the email for each question or point - do not rephrase or summarize\n2. If there\'s a direct question in the email like "When can we meet?" use that exact text as the [QUESTION]\n3. For statements that need a response but aren\'t questions, use the exact text from the email\n4. Always include the [OPTIONS]: section for any question with type CHOICES\n5. Separate each option with a comma. Do not use bullet points or line breaks within the options section\n\nExamples:\nIf the email says: "When can we meet to discuss the project?"\nUse: [QUESTION]: When can we meet to discuss the project?\n\nIf the email says: "I need your feedback on the budget proposal."\nUse: [QUESTION]: I need your feedback on the budget proposal.\n\nIf the email says: "Please let me know if you\'re available next week."\nUse: [QUESTION]: Please let me know if you\'re available next week.\n\nFor CHOICES type questions, provide options that represent different possible responses:\n[QUESTION]: I need your feedback on the budget proposal.\n[TYPE]: CHOICES\n[OPTIONS]: The budget looks good and I approve it, The budget needs minor adjustments before approval, The budget requires significant revisions, I need more information before providing feedback\n[END]\n\nMake each option distinct, specific, and actionable. Aim to provide options that represent genuinely different approaches to responding, not just minor variations of the same response. Always use commas to separate options.'
    } else if (type === 'generate') {
      systemPrompt = 'You are an email writing expert. Use the provided information to generate a professional, well-structured email with appropriate greeting, body paragraphs, and sign-off. Make it concise, clear, and effective.\n\nImportantly, use square brackets [like this] to indicate places where the user might want to customize the content. Good candidates for placeholders include:\n- Names: "Dear [Recipient Name]"\n- Dates: "by [specific date]"\n- Specific details: "regarding our [project/product] discussion"\n- Personal touches: "I enjoyed [specific detail about previous interaction]"\n\nInclude 3-5 such placeholders in your email to make it easy for the user to personalize. Make the placeholder text descriptive of what should go there.'
    } else if (type === 'document') {
      systemPrompt = 'You are a document writing assistant helping users create well-structured, professional documents on various topics. Provide clear, concise, and well-organized responses that directly address the user\'s document creation needs. For document structure requests, suggest logical divisions that cover the topic comprehensively. For content generation, create professional, informative text that follows academic or business writing conventions appropriate to the subject matter.'
    } else {
      systemPrompt = 'You are an email assistant helping users write better emails.'
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    })

    return NextResponse.json(response.choices[0].message)
  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'Error communicating with OpenAI' },
      { status: 500 }
    )
  }
} 