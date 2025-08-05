import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { MODEL } from '@/app/config/constants';
import { InputValidator, ServerRateLimiter } from '@/app/lib/utils/api-helpers';

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Server-side rate limiting
    if (!ServerRateLimiter.checkLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }


    //     query - The (natural language) recipe search query
    //     cuisine - The cuisine(s) of the recipes. If no cuisines are mentioned in the user's query, use the 'null' string as the only value in the array.
    //     excludeCuisine - The cuisine(s) the recipes must not match. If no excluded cuisines are mentioned in the user's query, use the 'null' string as the only value in the array.
    //     diet - The diet(s) for which the recipes must be suitable. You can specify multiple. If no diets are mentioned in the user's query, use the 'null' string for both the diet and the connector values, and list that object as the only value in the array.
    //     intolerances - A list of intolerances. All recipes returned must not contain ingredients that are not suitable for people with the intolerances entered. If no intolerances are mentioned in the user's query, use the 'null' string as the only value in the array.
    //     includeIngredients - A list of ingredients that should/must be used in the recipes. If no ingredients are mentioned in the user's query, use a 'null' string as the only value in the array.
    //     excludeIngredients - A list of ingredients or ingredient types that the recipes must not contain. If no excluded ingredients are mentioned in the user's query, use a 'null' string as the only value in the array.
    //     type - The type of recipe. If no meal types are mentioned in the user's query, use the 'null' string as the only value in the array.
    //     maxReadyTime - The maximum time in minutes it should take to prepare and cook the recipe. If no maximum time is mentioned in the user's query, use a 0 as the value.

//     const Diet = z.object({
//         diet: z.enum(['gluten free', 'vegetarian', 'vegan','null']),
//         connector: z.enum(['OR','AND','null'])
//     })
//     const Cuisine = z.enum(['African','Asian','American','British','Cajun','Caribbean','Chinese','Eastern European','European','French','German','Greek',
//   'Indian','Irish','Italian','Japanese','Jewish','Korean','Latin American','Mediterranean','Mexican','Middle Eastern','Nordic','Southern','Spanish','Thai','Vietnamese','null'])
//     const ComplexQuery = z.object({
//         query: z.string(),
//         cuisine: z.array(Cuisine),
//         excludeCuisine: z.array(Cuisine),
//         diet: z.array(Diet),
//         intolerances: z.array(z.enum(['Dairy','Egg','Gluten','Grain','Peanut','Seafood','Sesame','Shellfish','Soy','Sulfite','Tree','Nut','Wheat', 'null'])),
//         includeIngredients: z.array(z.string()),
//         excludeIngredients: z.array(z.string()),
//         type: z.enum(['main','course','side','dish','dessert','appetizer','salad','bread','breakfast','soup','beverage','sauce','marinade','fingerfood','snack','drink','null']),
//         maxReadyTime: z.number()
//     })

    const { input } = await request.json();

    // Enhanced validation
    const textValidation = InputValidator.validateText(input, 2000);
    if (!textValidation.isValid) {
      return NextResponse.json({ error: textValidation.error }, { status: 400 });
    }

    // Environment validation
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not configured');
      return NextResponse.json(
        { error: 'Translation service temporarily unavailable' },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey,
    });

    // Enhanced content moderation
    const moderatedText = await client.moderations.create({
      input,
    });

    const { flagged, categories } = moderatedText.results[0];

    if (flagged) {
      const keys: string[] = Object.keys(categories);
      const flaggedCategories = keys.filter(
        (key: string) => categories[key as keyof typeof categories]
      );
      return NextResponse.json(
        {
          error: `Content flagged as inappropriate: ${flaggedCategories.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const tools = [
        {
            type: "function" as const,
            name: "translate_to_api_query",
            description: "Translate the user's query into a set of parameters in preparation for a call to a recipe API.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: ["string"],
                        description: "The (natural language) recipe search query",
                    },
                    cuisine: {
                        type: "array",
                        items: {
                            $ref: "#/$defs/cuisine"
                        },
                        description: "If any of the cuisine values are mentioned in the user's query, add each of those cuisine values found to the array. Otherwise this can be an empty array."
                    },
                    excludeCuisine: {
                        type: "array",
                        items: {
                            $ref: "#/$defs/cuisine"
                        },
                        description: "If any of the cuisine values are mentioned in the user's query as a cuisine that should not be included in the search, add each of those cuisine values to the array. Otherwise this can be an empty array."
                    },
                    diet: {
                        type: "array",
                        items: {
                            $ref: "#/$defs/diet"
                        },
                        description: "If any of the diet values are mentioned in the user's query as a diet for which the recipes must be suitable, add each of those diet values found to the array. Otherwise this can be an empty array."
                    },
                    intolerances: {
                        type: "array",
                        items: {
                            $ref: "#/$defs/intolerances"
                        },
                        description: "If any of the intolerance values are mentioned in the user's query as an intolerance for which the recipes must account, add each of those intolerance values found to the array. Otherwise this can be an empty array.",
                    },
                    includeIngredients: {
                        type: "array",
                        items: {
                            type: "string"
                        },
                        description: "If the user mentions any ingredients to be included in the recipe, add each of those ingredients to the array as a separate value. If no ingredients are mentioned in the user's query, this can be an empty array."
                    },
                    excludeIngredients: {
                        type: "array",
                        items: {
                            type: "string"
                        },
                        description: "If the user mentions any ingredients to be excluded from the recipe, add each of those ingredients to the array as a separate value. If no ingredients are mentioned in the user's query, this can be an empty array."
                    },
                    type: {
                        type: ["string","null"],
                        description: "If any of the type values are mentioned in the user's query, assign that value as the type. If no type is mentioned, this can be a null value.",
                        enum: ['main','course','side','dish','dessert','appetizer','salad','bread','breakfast','soup','beverage','sauce','marinade','fingerfood','snack','drink']
                    },
                    maxReadyTime: {
                        type: ["number","null"],
                        description: "The maximum time in minutes it should take to prepare and cook the recipe. If no maxiumum time is mentioned in the user's query, this can be a null value."
                    }
                },
                $defs: {
                    cuisine: {
                        type: ["string","null"],
                        description: "Available cuisine values to choose from",
                        enum: ['African','Asian','American','British','Cajun','Caribbean','Chinese','Eastern European','European','French','German','Greek','Indian','Irish','Italian','Japanese','Jewish','Korean','Latin American','Mediterranean','Mexican','Middle Eastern','Nordic','Southern','Spanish','Thai','Vietnamese']
                    },
                    diet: {
                        type: ["string","null"],
                        description: "Available diet values to choose from",
                        enum: ['gluten free', 'vegetarian', 'vegan']
                    },
                    intolerances: {
                        type: ["string","null"],
                        description: "Available intolerances values to choose from",
                        enum: ['Dairy','Egg','Gluten','Grain','Peanut','Seafood','Sesame','Shellfish','Soy','Sulfite','Tree','Nut','Wheat']
                    }
                },
                required: ["query", "cuisine", "excludeCuisine", "diet", "intolerances", "includeIngredients", "excludeIngredients", "type", "maxReadyTime"],
                additionalProperties: false,
            },
            strict: true
        }];

        const instructions: string =
        `Your job is to convert the user's request into a query string to use with the Spoonacular API call. The query string should start with a '?' and contain any appropriate key value pairs in the form of a url query string e.g.:
        ?query=pasta&cuisine=Irish&type=main

        For parameters not mentioned in the original user's query, that parameter should not be included in the query string. Take note of the following parameter notes:
        cuisine - allows for one or more, comma separated e.g. cuisine=asian,mexican ;
        excludeCuisine - allows for one or more, comma separated e.g. excludeCuisine=greek,japanese ;
        diet - you can specify multiple with comma meaning AND connection. You can specify multiple diets separated with a pipe | meaning OR connection. e.g. diet=gluten free,vegetarian means the recipes must be both, gluten free and vegetarian. As an example of the OR connection, diet=vegan|vegetarian means you want recipes that are vegan OR vegetarian ;
        intolerances - allows for one or more, comma separated ;
        includeIngredients - allows for one or more, comma separated ;
        excludeIngredients - allows for one or more, comma separated ;
        `;


    const response = await client.responses.create({
      model: MODEL,
      instructions,
      input,
      tools
    });

    if (response.status !== 'completed') {
      throw new Error(`Responses API error: ${response.status}`);
    }

    return NextResponse.json({
      response: response.output_text || 'Response recieved',
      originalInput: input,
      remainingRequests: ServerRateLimiter.getRemaining(ip),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'OpenAI failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
